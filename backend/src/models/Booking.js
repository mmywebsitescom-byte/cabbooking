import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
    default: () => {
      const prefix = 'DE';
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 5).toUpperCase();
      return `${prefix}${timestamp}${random}`;
    },
    required: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },

  // Timing
  pickupDateTime: { type: Date, required: true },
  returnDateTime: { type: Date, required: true },
  actualReturnDateTime: { type: Date },

  // Duration
  rentalDuration: {
    hours: { type: Number, default: 0 },
    days: { type: Number, default: 0 },
    totalHours: { type: Number, required: true },
  },

  // Customer Details at booking time
  customerDetails: {
    name: String,
    email: String,
    phone: String,
    address: String,
    drivingLicenceNumber: String,
  },

  // Pricing breakdown
  pricing: {
    hourlyRate: Number,
    dailyRate: Number,
    securityDeposit: Number,
    rentalCharges: Number,
    extraTimeCharges: { type: Number, default: 0 },
    taxes: { type: Number, default: 0 },
    discounts: { type: Number, default: 0 },
    totalAmount: Number,
  },

  // Status flow: pending → confirmed → active → completed → cancelled
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'no_show'],
    default: 'pending'
  },

  // Payment
  payment: {
    method: { type: String, enum: ['online', 'cash'], required: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'partially_paid', 'refunded', 'failed'],
      default: 'pending'
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    paidAt: Date,
    amount: Number,
    currency: { type: String, default: 'INR' },
  },

  // Extra charges if late return
  extraCharges: {
    extraHours: { type: Number, default: 0 },
    extraAmount: { type: Number, default: 0 },
    reason: String,
  },

  // Cancellation
  cancellation: {
    cancelledAt: Date,
    cancelledBy: { type: String, enum: ['customer', 'admin'] },
    reason: String,
    refundAmount: { type: Number, default: 0 },
    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'not_applicable'],
      default: 'not_applicable'
    }
  },

  // 6-Digit Secret Handover Code
  secretCode: {
    type: String,
    default: () => Math.floor(100000 + Math.random() * 900000).toString(),
    required: true,
  },
  // Handover status
  handoverStatus: {
    type: String,
    enum: ['awaiting_code_verification', 'code_verified_delivered', 'returned'],
    default: 'awaiting_code_verification'
  },
  deliveredAt: Date,
  deliveredBy: String,

  specialRequests: String,
  adminNotes: String,
  isDemo: { type: Boolean, default: false },

}, { timestamps: true });

// Generate booking ID and secret code before save
bookingSchema.pre('save', function (next) {
  if (!this.bookingId) {
    const prefix = 'DE';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.bookingId = `${prefix}${timestamp}${random}`;
  }
  if (!this.secretCode) {
    this.secretCode = Math.floor(100000 + Math.random() * 900000).toString();
  }
  next();
});

export const Booking = mongoose.model('Booking', bookingSchema);
