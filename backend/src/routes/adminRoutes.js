import { Router } from 'express';
import { getPublicSettings, getAllSettings, updateSettings } from '../controllers/settingsController.js';
import {
  getDashboardStats, getAllBookings, updateBookingStatus,
  approveBooking, rejectBooking, refundBooking, getAdminPayments
} from '../controllers/bookingController.js';
import { getAllCarsAdmin } from '../controllers/carController.js';
import { User } from '../models/User.js';
import { Booking } from '../models/Booking.js';
import { AuditLog } from '../models/AuditLog.js';
import { Settings } from '../models/Settings.js';
import { Car } from '../models/Car.js';
import { Location } from '../models/Location.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { protect, adminOnly } from '../middlewares/auth.js';

const router = Router();

// ================= PUBLIC =================
router.get('/settings/public', getPublicSettings);

// ================= ADMIN SETTINGS =================
router.get('/admin/settings', protect, adminOnly, getAllSettings);
router.put('/admin/settings', protect, adminOnly, updateSettings);

// ================= ADMIN DASHBOARD & BOOKINGS =================
router.get('/admin/dashboard', protect, adminOnly, getDashboardStats);
router.get('/admin/bookings', protect, adminOnly, getAllBookings);
router.put('/admin/bookings/:id/status', protect, adminOnly, updateBookingStatus);
router.post('/admin/bookings/:id/approve', protect, adminOnly, approveBooking);
router.post('/admin/bookings/:id/reject', protect, adminOnly, rejectBooking);
router.post('/admin/bookings/:id/refund', protect, adminOnly, refundBooking);

// ================= ADMIN PAYMENTS =================
router.get('/admin/payments', protect, adminOnly, getAdminPayments);

// ================= ADMIN FLEET =================
router.get('/admin/cars', protect, adminOnly, getAllCarsAdmin);

// ================= ADMIN USERS & CUSTOMERS =================
router.get('/admin/users', protect, adminOnly, asyncHandler(async (req, res) => {
  const users = await User.find({ role: 'customer' }).sort({ createdAt: -1 });

  // Enrich with user total bookings count and total spent
  const enrichedUsers = await Promise.all(
    users.map(async (u) => {
      const bookingsCount = await Booking.countDocuments({ customer: u._id });
      const paidBookings = await Booking.aggregate([
        { $match: { customer: u._id, 'payment.status': 'paid' } },
        { $group: { _id: null, totalSpent: { $sum: '$pricing.totalAmount' } } }
      ]);
      return {
        ...u.toObject(),
        totalBookings: bookingsCount,
        totalSpent: paidBookings[0]?.totalSpent || 0,
      };
    })
  );

  res.json({ success: true, count: enrichedUsers.length, data: enrichedUsers });
}));

router.put('/admin/users/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const { isActive, name, phone, drivingLicence } = req.body;
  const updateData = {};
  if (typeof isActive === 'boolean') updateData.isActive = isActive;
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;
  if (drivingLicence) updateData.drivingLicence = drivingLicence;

  const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  res.json({ success: true, data: user });
}));

router.get('/admin/users/:id/bookings', protect, adminOnly, asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ customer: req.params.id })
    .populate('car', 'name brand model images category pricing')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: bookings.length, data: bookings });
}));

// ================= AUDIT LOGS =================
router.get('/admin/audit-logs', protect, adminOnly, asyncHandler(async (req, res) => {
  const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
  res.json({ success: true, count: logs.length, data: logs });
}));

router.post('/admin/audit-logs', protect, adminOnly, asyncHandler(async (req, res) => {
  const { action, category, details, targetId } = req.body;
  if (!action || !details) {
    return res.status(400).json({ success: false, error: 'Action and details are required' });
  }
  const log = await AuditLog.create({
    action,
    category: category || 'security',
    details,
    targetId: targetId || '',
    performedBy: {
      userId: req.user._id,
      name: req.user.name || 'Admin',
      email: req.user.email || 'admin@veloce.io',
    },
    ipAddress: req.ip || '127.0.0.1'
  });
  res.status(201).json({ success: true, data: log });
}));

// ================= PRICING & COUPONS =================
const DEFAULT_COUPONS = [
  { code: 'VELOCE10', discountPercent: 10, minHours: 4, maxDiscount: 100, isActive: true, description: '10% off for rentals above 4 hours' },
  { code: 'WEEKEND20', discountPercent: 20, minHours: 24, maxDiscount: 250, isActive: true, description: '20% off for 24+ hour weekend trips' },
  { code: 'FIRSTDRIVE', discountPercent: 15, minHours: 2, maxDiscount: 75, isActive: true, description: '15% welcome discount for new drivers' },
  { code: 'TRACKDAY', discountPercent: 25, minHours: 48, maxDiscount: 500, isActive: false, description: '25% premium multi-day touring discount' },
];

router.get('/admin/coupons', protect, adminOnly, asyncHandler(async (req, res) => {
  let doc = await Settings.findOne({ key: 'admin_coupons' });
  if (!doc) {
    doc = await Settings.create({
      key: 'admin_coupons',
      value: DEFAULT_COUPONS,
      category: 'pricing',
      label: 'Promotional Discount Coupons'
    });
  }
  res.json({ success: true, data: doc.value || DEFAULT_COUPONS });
}));

router.post('/admin/coupons', protect, adminOnly, asyncHandler(async (req, res) => {
  const { coupons } = req.body;
  if (!Array.isArray(coupons)) {
    return res.status(400).json({ success: false, error: 'Coupons must be an array' });
  }
  let doc = await Settings.findOne({ key: 'admin_coupons' });
  if (!doc) {
    doc = await Settings.create({
      key: 'admin_coupons',
      value: coupons,
      category: 'pricing',
      label: 'Promotional Discount Coupons'
    });
  } else {
    doc.value = coupons;
    await doc.save();
  }
  res.json({ success: true, message: 'Coupons updated successfully', data: doc.value });
}));

// ================= SITE CMS & PAGE EDITOR =================
const DEFAULT_CMS = {
  hero: {
    headlineMain: "Your Drive. Your Time.",
    headlineHighlight: "Your Freedom.",
    bgImage: "/images/hero-bg.jpg",
  },
  policies: {
    fuelPolicy: "Customer provides their own fuel. Vehicles are inspected at hub handover and returned with matched fuel level.",
    secretPinPolicy: "Meet company driver at reserved hub. Verify your secure 6-digit secret code before keys are handed over.",
    depositPolicy: "Refundable security deposit is pre-authorized and automatically released within 2 hours of post-trip vehicle return inspection."
  },
  support: {
    hotline: "+1 (800) 835-6231",
    email: "support@veloce.io",
    hours: "24/7 Roadside & Hub Dispatch Active"
  }
};

router.get('/settings/cms', asyncHandler(async (req, res) => {
  let doc = await Settings.findOne({ key: 'site_cms_content' });
  if (!doc) {
    doc = await Settings.create({
      key: 'site_cms_content',
      value: DEFAULT_CMS,
      category: 'general',
      label: 'Site CMS & Page Content'
    });
  }
  res.json({ success: true, data: doc.value || DEFAULT_CMS });
}));

router.get('/admin/cms', protect, adminOnly, asyncHandler(async (req, res) => {
  let doc = await Settings.findOne({ key: 'site_cms_content' });
  if (!doc) {
    doc = await Settings.create({
      key: 'site_cms_content',
      value: DEFAULT_CMS,
      category: 'general',
      label: 'Site CMS & Page Content'
    });
  }
  res.json({ success: true, data: doc.value || DEFAULT_CMS });
}));

router.put('/admin/cms', protect, adminOnly, asyncHandler(async (req, res) => {
  const { cms } = req.body;
  if (!cms || typeof cms !== 'object') {
    return res.status(400).json({ success: false, error: 'Invalid CMS content payload' });
  }
  let doc = await Settings.findOne({ key: 'site_cms_content' });
  if (!doc) {
    doc = await Settings.create({
      key: 'site_cms_content',
      value: cms,
      category: 'general',
      label: 'Site CMS & Page Content'
    });
  } else {
    doc.value = cms;
    await doc.save();
  }
  
  await AuditLog.create({
    action: 'UPDATE_SITE_CMS',
    category: 'system',
    details: 'Admin updated public site page content and hero settings',
    performedBy: { userId: req.user._id, name: req.user.name, email: req.user.email },
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({ success: true, message: 'Public page content updated successfully', data: doc.value });
}));

// ================= REVIEWS & TESTIMONIALS =================
const DEFAULT_REVIEWS = [
  {
    id: 'r1',
    author: 'Marcus Vance',
    role: 'Verified Driver • 18 Trips Logged',
    initials: 'MV',
    vehicle: 'BMW M3 Competition',
    rating: 5,
    quote: 'Arriving at the Main Downtown Hub, meeting the company driver at Bay 14, and having them verify my 6-digit code in 30 seconds before handing me the keys to an immaculate BMW M3 was pure perfection.',
    isApproved: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'r2',
    author: 'Elena Rostova',
    role: 'Verified Driver • 7 Trips Logged',
    initials: 'ER',
    vehicle: 'Porsche 911 Carrera',
    rating: 5,
    quote: 'Booking online was so simple. Selected my pickup and return times, signed in, got my 6-digit secret code. Driver arrived promptly, verified the code, and I was cruising Big Sur. Fueling up myself was very convenient.',
    isApproved: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'r3',
    author: 'David Thorne',
    role: 'Verified Driver • 24 Trips Logged',
    initials: 'DT',
    vehicle: 'Mercedes-AMG GT',
    rating: 5,
    quote: 'The car condition is showroom pristine. 50 vehicles to pick from, verified driver handover with the secret code, no long waiting lines or counter bureaucracy. Outstanding experience.',
    isApproved: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'r4',
    author: 'Sarah Jenkins',
    role: 'Verified Driver • 12 Trips Logged',
    initials: 'SJ',
    vehicle: 'Audi RS6 Avant',
    rating: 5,
    quote: 'The in-person hub handover with the 6-digit PIN eliminates all fraudulent app unlock glitches. Company driver was waiting on the dot. Premium concierge service at reasonable rates.',
    isApproved: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'r5',
    author: 'Liam Patel',
    role: 'Verified Driver • 9 Trips Logged',
    initials: 'LP',
    vehicle: 'Tesla Model S Plaid',
    rating: 5,
    quote: 'Transparent exact-time billing without hidden airport concessions or surprise deposits. The car had 98% charge and pristine interior. Will definitely book again.',
    isApproved: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'r6',
    author: 'Carlos Mendez',
    role: 'Verified Driver • 15 Trips Logged',
    initials: 'CM',
    vehicle: 'Ford Mustang Dark Horse',
    rating: 5,
    quote: 'Zero deductible protection gave complete peace of mind on the coastal drive. Swift handoff with secret code verification took under a minute. Absolutely elite.',
    isApproved: true,
    createdAt: new Date().toISOString()
  }
];

router.get('/reviews/public', asyncHandler(async (req, res) => {
  let doc = await Settings.findOne({ key: 'admin_reviews' });
  const reviews = doc?.value || DEFAULT_REVIEWS;
  const approved = reviews.filter(r => r.isApproved !== false);
  res.json({ success: true, count: approved.length, data: approved });
}));

router.get('/admin/reviews', protect, adminOnly, asyncHandler(async (req, res) => {
  let doc = await Settings.findOne({ key: 'admin_reviews' });
  if (!doc) {
    doc = await Settings.create({
      key: 'admin_reviews',
      value: DEFAULT_REVIEWS,
      category: 'general',
      label: 'Customer Testimonials and Reviews'
    });
  }
  res.json({ success: true, count: doc.value.length, data: doc.value });
}));

router.post('/admin/reviews', protect, adminOnly, asyncHandler(async (req, res) => {
  const { author, role, vehicle, rating, quote, isApproved } = req.body;
  if (!author || !quote) {
    return res.status(400).json({ success: false, error: 'Author and review text are required' });
  }
  let doc = await Settings.findOne({ key: 'admin_reviews' });
  const reviews = doc ? [...doc.value] : [...DEFAULT_REVIEWS];
  const newReview = {
    id: 'rev_' + Date.now(),
    author,
    role: role || 'Verified Customer',
    initials: author.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'VD',
    vehicle: vehicle || 'VELOCE Fleet Vehicle',
    rating: Number(rating) || 5,
    quote,
    isApproved: isApproved !== false,
    createdAt: new Date().toISOString()
  };
  reviews.unshift(newReview);
  
  if (!doc) {
    doc = await Settings.create({ key: 'admin_reviews', value: reviews, category: 'general', label: 'Customer Reviews' });
  } else {
    doc.value = reviews;
    await doc.save();
  }

  await AuditLog.create({
    action: 'CREATE_REVIEW',
    category: 'system',
    details: `Added new testimonial from ${author}`,
    performedBy: { userId: req.user._id, name: req.user.name, email: req.user.email },
    ipAddress: req.ip || '127.0.0.1'
  });

  res.status(201).json({ success: true, data: newReview });
}));

router.put('/admin/reviews/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  let doc = await Settings.findOne({ key: 'admin_reviews' });
  const reviews = doc ? [...doc.value] : [...DEFAULT_REVIEWS];
  const index = reviews.findIndex(r => r.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Review not found' });
  }
  reviews[index] = { ...reviews[index], ...updates };
  doc.value = reviews;
  await doc.save();

  await AuditLog.create({
    action: 'UPDATE_REVIEW',
    category: 'system',
    details: `Updated testimonial ${id} (Approved: ${reviews[index].isApproved})`,
    performedBy: { userId: req.user._id, name: req.user.name, email: req.user.email },
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({ success: true, data: reviews[index] });
}));

router.delete('/admin/reviews/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;
  let doc = await Settings.findOne({ key: 'admin_reviews' });
  const reviews = doc ? [...doc.value] : [...DEFAULT_REVIEWS];
  const filtered = reviews.filter(r => r.id !== id);
  doc.value = filtered;
  await doc.save();

  await AuditLog.create({
    action: 'DELETE_REVIEW',
    category: 'system',
    details: `Deleted testimonial ${id}`,
    performedBy: { userId: req.user._id, name: req.user.name, email: req.user.email },
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({ success: true, message: 'Review deleted successfully' });
}));

// ================= BACKUP & DATA EXPORT =================
router.get('/admin/backup/export', protect, adminOnly, asyncHandler(async (req, res) => {
  const [cars, bookings, users, logs, settings] = await Promise.all([
    Car.find().lean(),
    Booking.find().populate('car', 'name brand model').populate('customer', 'name email').lean(),
    User.find().select('-password').lean(),
    AuditLog.find().sort({ createdAt: -1 }).limit(200).lean(),
    Settings.find().lean()
  ]);

  const backupData = {
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    system: 'VELOCE Car Rental Platform',
    counts: {
      cars: cars.length,
      bookings: bookings.length,
      users: users.length,
      auditLogs: logs.length,
      settings: settings.length
    },
    data: {
      cars,
      bookings,
      users,
      auditLogs: logs,
      settings
    }
  };

  await AuditLog.create({
    action: 'DATABASE_BACKUP_EXPORT',
    category: 'security',
    details: `Exported full database backup (${cars.length} cars, ${bookings.length} bookings, ${users.length} users)`,
    performedBy: { userId: req.user._id, name: req.user.name, email: req.user.email },
    ipAddress: req.ip || '127.0.0.1'
  });

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="veloce_backup_${new Date().toISOString().slice(0, 10)}.json"`);
  res.json(backupData);
}));

router.get('/admin/backup/stats', protect, adminOnly, asyncHandler(async (req, res) => {
  const [carsCount, bookingsCount, usersCount, logsCount] = await Promise.all([
    Car.countDocuments(),
    Booking.countDocuments(),
    User.countDocuments(),
    AuditLog.countDocuments()
  ]);
  const lastBackupLog = await AuditLog.findOne({ action: 'DATABASE_BACKUP_EXPORT' }).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: {
      carsCount,
      bookingsCount,
      usersCount,
      logsCount,
      lastBackupAt: lastBackupLog?.createdAt || null,
      systemHealth: 'OPERATIONAL',
      database: 'MongoDB Local',
      databaseStatus: 'Connected & Verified'
    }
  });
}));

// ================= PICKUP LOCATIONS MANAGEMENT =================
const DEFAULT_LOCATIONS = [
  {
    code: 'DWTN-HUB',
    name: 'Main Downtown Car Hub - 4th St',
    address: '450 4th Street, Downtown Center',
    city: 'San Francisco',
    operatingHours: '24/7 Handover',
    phone: '+91 98765 43210',
    hubPin: 'Bay 14',
    isActive: true
  },
  {
    code: 'CENTRAL-OFFICE',
    name: 'Central Company Office Lot',
    address: '100 Market St, Financial District',
    city: 'San Francisco',
    operatingHours: '06:00 AM - 11:00 PM',
    phone: '+91 98765 43211',
    hubPin: 'Bay 02',
    isActive: true
  },
  {
    code: 'AIRPORT-EXPRESS',
    name: 'Airport Express Hub - Bay 14',
    address: 'Terminal 3 International, Parking B-2',
    city: 'San Francisco / Airport',
    operatingHours: '24/7 Handover',
    phone: '+91 98765 43212',
    hubPin: 'Bay 14',
    isActive: true
  },
  {
    code: 'OAK-HUB',
    name: 'Oakland City Center Metro Bay',
    address: '1200 Broadway, City Center Mall',
    city: 'Oakland',
    operatingHours: '07:00 AM - 10:00 PM',
    phone: '+91 98765 43213',
    hubPin: 'Bay 08',
    isActive: true
  },
  {
    code: 'PA-STAN',
    name: 'Palo Alto Tech Plaza Station',
    address: '3000 El Camino Real, Tech Park',
    city: 'Palo Alto',
    operatingHours: '06:00 AM - 11:00 PM',
    phone: '+91 98765 43214',
    hubPin: 'Bay 05',
    isActive: true
  },
  {
    code: 'MUM-BKC',
    name: 'Mumbai BKC Executive Hub',
    address: 'G-Block, Bandra Kurla Complex',
    city: 'Mumbai',
    operatingHours: '24/7 Handover',
    phone: '+91 98200 11223',
    hubPin: 'Bay 01',
    isActive: true
  },
  {
    code: 'BLR-KRM',
    name: 'Bengaluru Koramangala Hub',
    address: '100ft Inner Ring Road, Koramangala 4th Block',
    city: 'Bengaluru',
    operatingHours: '24/7 Handover',
    phone: '+91 98450 33445',
    hubPin: 'Bay 03',
    isActive: true
  },
  {
    code: 'DEL-AEROCITY',
    name: 'Delhi Aerocity Worldmark Hub',
    address: 'Hospitality District, IGI Airport T3',
    city: 'New Delhi',
    operatingHours: '24/7 Handover',
    phone: '+91 98110 55667',
    hubPin: 'Bay 11',
    isActive: true
  }
];

// Public: Get all active locations (seeds defaults if none)
router.get('/locations', asyncHandler(async (req, res) => {
  let locations = await Location.find({ isActive: true }).sort({ createdAt: 1 });
  if (locations.length === 0) {
    locations = await Location.insertMany(DEFAULT_LOCATIONS);
  }
  res.json({ success: true, count: locations.length, data: locations });
}));

// Admin: Get all locations (including inactive)
router.get('/admin/locations', protect, adminOnly, asyncHandler(async (req, res) => {
  let locations = await Location.find().sort({ createdAt: -1 });
  if (locations.length === 0) {
    locations = await Location.insertMany(DEFAULT_LOCATIONS);
  }
  res.json({ success: true, count: locations.length, data: locations });
}));

// Admin: Create new location
router.post('/admin/locations', protect, adminOnly, asyncHandler(async (req, res) => {
  const { code, name, address, city, operatingHours, phone, hubPin, isActive } = req.body;
  if (!name || !address || !city) {
    return res.status(400).json({ success: false, error: 'Name, address, and city are required' });
  }

  const locCode = (code || name.replace(/[^A-Za-z0-9]/g, '').slice(0, 8)).toUpperCase();
  const existing = await Location.findOne({ code: locCode });
  if (existing) {
    return res.status(400).json({ success: false, error: `Location code "${locCode}" already exists` });
  }

  const location = await Location.create({
    code: locCode,
    name: name.trim(),
    address: address.trim(),
    city: city.trim(),
    operatingHours: operatingHours?.trim() || '24/7 Handover',
    phone: phone?.trim() || '+91 98765 43210',
    hubPin: hubPin?.trim() || 'Bay 14',
    isActive: isActive !== false
  });

  await AuditLog.create({
    action: 'CREATE_LOCATION',
    category: 'fleet',
    details: `Added pickup location: ${name} (${locCode}) in ${city}`,
    performedBy: { userId: req.user._id, name: req.user.name, email: req.user.email },
    ipAddress: req.ip || '127.0.0.1'
  });

  res.status(201).json({ success: true, data: location });
}));

// Admin: Update/Edit existing location
router.put('/admin/locations/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (updates.code) {
    updates.code = updates.code.toUpperCase().trim();
    const existing = await Location.findOne({ code: updates.code, _id: { $ne: id } });
    if (existing) {
      return res.status(400).json({ success: false, error: `Location code "${updates.code}" is already in use` });
    }
  }

  const location = await Location.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!location) {
    return res.status(404).json({ success: false, error: 'Location not found' });
  }

  await AuditLog.create({
    action: 'UPDATE_LOCATION',
    category: 'fleet',
    details: `Updated location ${location.name} (${location.code})`,
    performedBy: { userId: req.user._id, name: req.user.name, email: req.user.email },
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({ success: true, data: location });
}));

// Admin: Delete location
router.delete('/admin/locations/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const location = await Location.findByIdAndDelete(id);
  if (!location) {
    return res.status(404).json({ success: false, error: 'Location not found' });
  }

  await AuditLog.create({
    action: 'DELETE_LOCATION',
    category: 'fleet',
    details: `Deleted location ${location.name} (${location.code})`,
    performedBy: { userId: req.user._id, name: req.user.name, email: req.user.email },
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({ success: true, message: 'Location deleted successfully' });
}));

export default router;
