import crypto from 'crypto';
import { Booking } from '../models/Booking.js';
import { Car } from '../models/Car.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { config } from '../config/config.js';
import { isCarAvailable } from './carController.js';

// Calculate pricing
const calculatePricing = (car, pickupDT, returnDT) => {
  const ms = returnDT - pickupDT;
  const totalHours = ms / (1000 * 60 * 60);
  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;

  let rentalCharges = 0;
  if (days > 0) {
    rentalCharges += days * car.pricing.dailyRate;
    if (remainingHours > 0) {
      // Charge remaining hours at hourly rate (or daily if >12 hrs)
      rentalCharges += remainingHours > 12
        ? car.pricing.dailyRate
        : remainingHours * car.pricing.hourlyRate;
    }
  } else {
    rentalCharges = totalHours * car.pricing.hourlyRate;
  }

  const taxes = Math.round(rentalCharges * 0.18); // 18% GST
  const totalAmount = Math.round(rentalCharges + taxes + car.pricing.securityDeposit);

  return {
    hourlyRate: car.pricing.hourlyRate,
    dailyRate: car.pricing.dailyRate,
    securityDeposit: car.pricing.securityDeposit,
    rentalCharges: Math.round(rentalCharges),
    taxes,
    discounts: 0,
    totalAmount,
    duration: { totalHours: parseFloat(totalHours.toFixed(2)), days, hours: parseFloat(remainingHours.toFixed(2)) }
  };
};

// @POST /api/bookings
export const createBooking = asyncHandler(async (req, res) => {
  const { carId, pickupDateTime, returnDateTime, paymentMethod, customerDetails, specialRequests } = req.body;

  if (!carId || !pickupDateTime || !returnDateTime || !paymentMethod) {
    return res.status(400).json({ success: false, error: 'Car, pickup/return dates and payment method are required' });
  }

  const pickup = new Date(pickupDateTime);
  const ret = new Date(returnDateTime);

  if (isNaN(pickup) || isNaN(ret)) {
    return res.status(400).json({ success: false, error: 'Invalid date format' });
  }
  if (pickup >= ret) {
    return res.status(400).json({ success: false, error: 'Return time must be after pickup time' });
  }
  // Disallow previous days: only today and upcoming days are allowed
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  if (pickup < todayStart) {
    return res.status(400).json({
      success: false,
      error: 'Pickup date cannot be a previous day. Only bookings for today and future days are permitted.'
    });
  }
  // Allow 15-minute grace period for clock skew / form completion time
  if (pickup < new Date(Date.now() - 15 * 60 * 1000)) {
    return res.status(400).json({
      success: false,
      error: 'Pickup time cannot be in the past. Please select an upcoming hour.'
    });
  }

  const car = await Car.findById(carId);
  if (!car || !car.isActive) {
    return res.status(404).json({ success: false, error: 'Car not found' });
  }

  const available = await isCarAvailable(carId, pickup, ret);
  if (!available) {
    return res.status(409).json({
      success: false,
      error: `All ${car.totalQuantity || 1} unit(s) of ${car.name} are already booked for this time period. Please choose different dates/times.`
    });
  }

  const pricing = calculatePricing(car, pickup, ret);

  const booking = await Booking.create({
    customer: req.user._id,
    car: carId,
    pickupDateTime: pickup,
    returnDateTime: ret,
    rentalDuration: {
      hours: pricing.duration.hours,
      days: pricing.duration.days,
      totalHours: pricing.duration.totalHours,
    },
    customerDetails: customerDetails || {
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
    },
    pricing: {
      hourlyRate: pricing.hourlyRate,
      dailyRate: pricing.dailyRate,
      securityDeposit: pricing.securityDeposit,
      rentalCharges: pricing.rentalCharges,
      taxes: pricing.taxes,
      discounts: pricing.discounts,
      totalAmount: pricing.totalAmount,
    },
    payment: {
      method: paymentMethod,
      status: 'pending',
      amount: pricing.totalAmount,
    },
    status: 'pending',
    secretCode: Math.floor(100000 + Math.random() * 900000).toString(),
    handoverStatus: 'awaiting_code_verification',
    specialRequests,
    isDemo: config.demoMode,
  });

  await booking.populate('car', 'name brand model images category pricing');
  await booking.populate('customer', 'name email phone');

  res.status(201).json({
    success: true,
    message: 'Booking created. Please complete payment to confirm.',
    data: booking
  });
});

// @POST /api/bookings/:id/payment/create-order (Razorpay)
export const createPaymentOrder = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });
  if (booking.customer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }
  if (booking.status !== 'pending') {
    return res.status(400).json({ success: false, error: 'Booking is not in pending state' });
  }

  // Demo mode: simulate Razorpay order
  if (config.demoMode) {
    const demoOrderId = `order_DEMO_${Date.now()}`;
    booking.payment.razorpayOrderId = demoOrderId;
    await booking.save();
    return res.json({
      success: true,
      data: {
        orderId: demoOrderId,
        amount: booking.pricing.totalAmount * 100, // paise
        currency: 'INR',
        bookingId: booking._id,
        key: 'rzp_test_DEMO',
        isDemo: true,
      }
    });
  }

  // Real Razorpay
  try {
    const Razorpay = (await import('razorpay')).default;
    const razorpay = new Razorpay({ key_id: config.razorpay.keyId, key_secret: config.razorpay.keySecret });
    const order = await razorpay.orders.create({
      amount: booking.pricing.totalAmount * 100,
      currency: 'INR',
      receipt: booking.bookingId,
    });
    booking.payment.razorpayOrderId = order.id;
    await booking.save();
    res.json({
      success: true,
      data: { orderId: order.id, amount: order.amount, currency: order.currency, key: config.razorpay.keyId, bookingId: booking._id }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Payment gateway error: ' + err.message });
  }
});

// @POST /api/bookings/:id/payment/verify
export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });

  // Demo mode: auto-confirm
  if (config.demoMode) {
    booking.payment.status = 'paid';
    booking.payment.razorpayPaymentId = razorpayPaymentId || `pay_DEMO_${Date.now()}`;
    booking.payment.paidAt = new Date();
    booking.status = 'confirmed';
    await booking.save();
    await Car.findByIdAndUpdate(booking.car, { $inc: { totalRentals: 1 } });
    const populated = await Booking.findById(booking._id).populate('car', 'name brand model images').populate('customer', 'name email phone');
    return res.json({ success: true, message: 'Booking confirmed! (Demo Mode)', data: populated });
  }

  // Real verification
  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSignature = crypto.createHmac('sha256', config.razorpay.keySecret).update(body).digest('hex');
  if (expectedSignature !== razorpaySignature) {
    booking.payment.status = 'failed';
    await booking.save();
    return res.status(400).json({ success: false, error: 'Payment verification failed' });
  }

  booking.payment.status = 'paid';
  booking.payment.razorpayPaymentId = razorpayPaymentId;
  booking.payment.razorpaySignature = razorpaySignature;
  booking.payment.paidAt = new Date();
  booking.status = 'confirmed';
  await booking.save();
  await Car.findByIdAndUpdate(booking.car, { $inc: { totalRentals: 1 } });

  const populated = await Booking.findById(booking._id).populate('car', 'name brand model images').populate('customer', 'name email phone');
  res.json({ success: true, message: 'Booking confirmed!', data: populated });
});

// @POST /api/bookings/:id/cash-confirm (Admin confirms cash booking)
export const confirmCashBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });
  if (booking.payment.method !== 'cash') {
    return res.status(400).json({ success: false, error: 'Not a cash booking' });
  }
  booking.status = 'confirmed';
  booking.payment.status = 'pending'; // cash collected at pickup
  await booking.save();
  res.json({ success: true, message: 'Cash booking confirmed', data: booking });
});

// @POST /api/bookings/:id/verify-code
// In-person handover: Driver asks customer for 6-digit secret code, enters it, and delivers car
export const verifySecretCodeAndDeliverCar = asyncHandler(async (req, res) => {
  const { secretCode } = req.body;
  const booking = await Booking.findById(req.params.id)
    .populate('car', 'name brand model images plateNumber')
    .populate('customer', 'name email phone');

  if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });

  if (!secretCode || secretCode.toString().trim() !== (booking.secretCode || '').toString().trim()) {
    return res.status(400).json({
      success: false,
      error: 'Invalid 6-Digit Secret Handover Code! Please verify with the customer.'
    });
  }

  // Code verified: Mark car as delivered and trip active!
  booking.handoverStatus = 'code_verified_delivered';
  booking.status = 'active';
  booking.deliveredAt = new Date();
  booking.deliveredBy = req.user?.name || 'Company Hub Driver';
  await booking.save();

  res.json({
    success: true,
    message: '🎉 6-Digit Code Verified! Car successfully delivered to customer. Customer may now begin their trip.',
    data: booking
  });
});

// @GET /api/bookings (Customer - own bookings)
export const getMyBookings = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { customer: req.user._id };
  if (status) filter.status = status;
  const bookings = await Booking.find(filter)
    .populate('car', 'name brand model images category pricing')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: bookings.length, data: bookings });
});

// @GET /api/bookings/:id
export const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('car')
    .populate('customer', 'name email phone');
  if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });

  const isOwner = booking.customer._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) return res.status(403).json({ success: false, error: 'Access denied' });

  res.json({ success: true, data: booking });
});

// @GET /api/bookings/id/:bookingId (by bookingId string)
export const getBookingByBookingId = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ bookingId: req.params.bookingId })
    .populate('car')
    .populate('customer', 'name email phone');
  if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });
  const isOwner = booking.customer._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) return res.status(403).json({ success: false, error: 'Access denied' });
  res.json({ success: true, data: booking });
});

// @POST /api/bookings/:id/cancel
export const cancelBooking = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });

  const isOwner = booking.customer.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) return res.status(403).json({ success: false, error: 'Access denied' });

  if (!['pending', 'confirmed'].includes(booking.status)) {
    return res.status(400).json({ success: false, error: `Cannot cancel a booking with status: ${booking.status}` });
  }

  const hoursUntilPickup = (new Date(booking.pickupDateTime) - new Date()) / (1000 * 60 * 60);
  let refundAmount = 0;
  if (booking.payment.status === 'paid') {
    if (hoursUntilPickup > 24) refundAmount = booking.pricing.totalAmount;
    else if (hoursUntilPickup > 4) refundAmount = Math.floor(booking.pricing.totalAmount * 0.5);
    else refundAmount = 0;
  }

  booking.status = 'cancelled';
  booking.cancellation = {
    cancelledAt: new Date(),
    cancelledBy: isAdmin ? 'admin' : 'customer',
    reason: reason || 'Cancelled by customer',
    refundAmount,
    refundStatus: refundAmount > 0 ? 'pending' : 'not_applicable'
  };
  await booking.save();

  res.json({ success: true, message: 'Booking cancelled', data: booking });
});

// ADMIN ENDPOINTS

// @GET /api/admin/bookings
export const getAllBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  const bookings = await Booking.find(filter)
    .populate('car', 'name brand model images')
    .populate('customer', 'name email phone')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));
  const total = await Booking.countDocuments(filter);
  res.json({ success: true, count: bookings.length, total, data: bookings });
});

// @PUT /api/admin/bookings/:id/status
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, adminNotes, actualReturnDateTime } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });

  booking.status = status;
  if (adminNotes) booking.adminNotes = adminNotes;

  if (status === 'completed' && actualReturnDateTime) {
    const actual = new Date(actualReturnDateTime);
    booking.actualReturnDateTime = actual;
    const expected = new Date(booking.returnDateTime);
    const extraMs = actual - expected;
    if (extraMs > 0) {
      const extraHours = Math.ceil(extraMs / (1000 * 60 * 60));
      const extraRate = booking.pricing.hourlyRate * 1.5; // 1.5x penalty
      const extraAmount = Math.round(extraHours * extraRate);
      booking.extraCharges = { extraHours, extraAmount, reason: `Late return by ${extraHours} hours` };
    }
  }

  if (status === 'active' && booking.payment.method === 'cash') {
    booking.payment.status = 'paid';
    booking.payment.paidAt = new Date();
  }

  await booking.save();
  res.json({ success: true, message: 'Booking status updated', data: booking });
});

// @GET /api/admin/dashboard
export const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalBookings,
    confirmedBookings,
    activeBookings,
    pendingBookings,
    completedBookings,
    cancelledBookings,
    totalCars,
    availableCars,
    revenuePaid,
    revenuePending,
    paidPaymentsCount,
    pendingPaymentsCount,
    categoryDistribution,
    recent
  ] = await Promise.all([
    Booking.countDocuments(),
    Booking.countDocuments({ status: 'confirmed' }),
    Booking.countDocuments({ status: 'active' }),
    Booking.countDocuments({ status: 'pending' }),
    Booking.countDocuments({ status: 'completed' }),
    Booking.countDocuments({ status: 'cancelled' }),
    Car.countDocuments({ isActive: true }),
    Car.countDocuments({ isActive: true, isAvailable: true }),
    Booking.aggregate([
      { $match: { 'payment.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
    ]),
    Booking.aggregate([
      { $match: { 'payment.status': 'pending' } },
      { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
    ]),
    Booking.countDocuments({ 'payment.status': 'paid' }),
    Booking.countDocuments({ 'payment.status': 'pending' }),
    Booking.aggregate([
      { $lookup: { from: 'cars', localField: 'car', foreignField: '_id', as: 'carDetails' } },
      { $unwind: '$carDetails' },
      { $group: { _id: '$carDetails.category', count: { $sum: 1 }, revenue: { $sum: '$pricing.totalAmount' } } }
    ]),
    Booking.find()
      .populate('car', 'name brand model images category pricing')
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(8)
  ]);

  // Aggregate 14-day daily trend
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const dailyRevenueTrend = await Booking.aggregate([
    { $match: { createdAt: { $gte: fourteenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        bookings: { $sum: 1 },
        revenue: {
          $sum: {
            $cond: [{ $eq: ['$payment.status', 'paid'] }, '$pricing.totalAmount', 0]
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Popular cars
  const popularCars = await Booking.aggregate([
    { $group: { _id: '$car', bookingCount: { $sum: 1 }, totalRevenue: { $sum: '$pricing.totalAmount' } } },
    { $sort: { bookingCount: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'cars', localField: '_id', foreignField: '_id', as: 'carDetails' } },
    { $unwind: '$carDetails' },
    {
      $project: {
        _id: 1,
        bookingCount: 1,
        totalRevenue: 1,
        name: '$carDetails.name',
        brand: '$carDetails.brand',
        category: '$carDetails.category',
        images: '$carDetails.images',
        pricing: '$carDetails.pricing'
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      totalBookings,
      confirmedBookings,
      activeBookings,
      pendingBookings,
      completedBookings,
      cancelledBookings,
      totalCars,
      availableCars,
      maintenanceCars: Math.max(0, totalCars - availableCars),
      totalRevenue: revenuePaid[0]?.total || 0,
      pendingPaymentAmount: revenuePending[0]?.total || 0,
      paidPaymentsCount,
      pendingPaymentsCount,
      categoryDistribution,
      dailyRevenueTrend,
      popularCars,
      recentBookings: recent,
    }
  });
});

// @POST /api/admin/bookings/:id/approve
export const approveBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });
  booking.status = 'confirmed';
  if (!booking.secretCode) {
    booking.secretCode = Math.floor(100000 + Math.random() * 900000).toString();
  }
  await booking.save();
  await booking.populate('car', 'name brand model images');
  await booking.populate('customer', 'name email phone');
  res.json({ success: true, message: 'Booking approved successfully', data: booking });
});

// @POST /api/admin/bookings/:id/reject
export const rejectBooking = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });
  booking.status = 'cancelled';
  booking.cancellation = {
    cancelledAt: new Date(),
    cancelledBy: 'admin',
    reason: reason || 'Rejected by Admin',
    refundAmount: booking.payment.status === 'paid' ? booking.pricing.totalAmount : 0,
    refundStatus: booking.payment.status === 'paid' ? 'pending' : 'not_applicable'
  };
  await booking.save();
  await booking.populate('car', 'name brand model images');
  await booking.populate('customer', 'name email phone');
  res.json({ success: true, message: 'Booking rejected and cancelled', data: booking });
});

// @POST /api/admin/bookings/:id/refund
export const refundBooking = asyncHandler(async (req, res) => {
  const { refundAmount } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });
  booking.payment.status = 'refunded';
  if (!booking.cancellation) {
    booking.cancellation = {
      cancelledAt: new Date(),
      cancelledBy: 'admin',
      reason: 'Refunded by Admin',
      refundAmount: Number(refundAmount) || booking.pricing.totalAmount,
      refundStatus: 'processed'
    };
  } else {
    booking.cancellation.refundStatus = 'processed';
    if (refundAmount) booking.cancellation.refundAmount = Number(refundAmount);
  }
  await booking.save();
  res.json({ success: true, message: 'Payment refunded successfully', data: booking });
});

// @GET /api/admin/payments
export const getAdminPayments = asyncHandler(async (req, res) => {
  const { status, method } = req.query;
  const filter = {};
  if (status && status !== 'all') filter['payment.status'] = status;
  if (method && method !== 'all') filter['payment.method'] = method;

  const bookings = await Booking.find(filter)
    .populate('car', 'name brand model images category pricing hubLocation')
    .populate('customer', 'name email phone')
    .sort({ createdAt: -1 });

  const [totalPaid, totalPending, totalRefunded] = await Promise.all([
    Booking.aggregate([
      { $match: { 'payment.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
    ]),
    Booking.aggregate([
      { $match: { 'payment.status': 'pending' } },
      { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
    ]),
    Booking.aggregate([
      { $match: { 'payment.status': 'refunded' } },
      { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
    ])
  ]);

  res.json({
    success: true,
    data: {
      payments: bookings,
      summary: {
        totalPaid: totalPaid[0]?.total || 0,
        totalPending: totalPending[0]?.total || 0,
        totalRefunded: totalRefunded[0]?.total || 0,
        totalCount: bookings.length
      }
    }
  });
});
