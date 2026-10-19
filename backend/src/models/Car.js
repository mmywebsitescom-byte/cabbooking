import mongoose from 'mongoose';

const carSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  brand: { type: String, required: true, trim: true },
  model: { type: String, required: true, trim: true },
  year: { type: Number, required: true },
  category: {
    type: String,
    enum: ['hatchback', 'sedan', 'suv', 'luxury', 'mpv', 'electric'],
    required: true
  },
  transmission: { type: String, enum: ['manual', 'automatic'], required: true },
  fuelType: { type: String, enum: ['petrol', 'diesel', 'electric', 'hybrid', 'cng'], required: true },
  seatingCapacity: { type: Number, required: true, min: 2, max: 10 },
  images: [{ type: String }],
  thumbnailIndex: { type: Number, default: 0 },

  pricing: {
    hourlyRate: { type: Number, required: true, min: 0 },
    dailyRate: { type: Number, required: true, min: 0 },
    securityDeposit: { type: Number, default: 5000, min: 0 },
    extraHourRate: { type: Number, default: 0 }, // extra hour over daily limit
  },

  features: [{ type: String }],
  description: { type: String, trim: true },

  // Fleet Quantity: Admin specifies how many cars of this same model are in fleet
  totalQuantity: { type: Number, default: 1, min: 1 },
  hubLocation: { type: String, default: 'Main Downtown Car Hub - 4th Street', trim: true },

  plateNumber: { type: String, default: '', uppercase: true },
  color: { type: String, trim: true },
  mileage: { type: Number }, // km per litre

  fuelPolicy: {
    type: String,
    enum: ['full-to-full', 'full-to-empty', 'same-to-same', 'customer-refuels', 'not-included'],
    default: 'customer-refuels'
  },
  minAgeRequired: { type: Number, default: 21 },
  licenceRequired: { type: Boolean, default: true },

  isAvailable: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },

  totalRentals: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },

}, { timestamps: true });

// Virtual: thumbnail image
carSchema.virtual('thumbnail').get(function () {
  if (this.images && this.images.length > 0) {
    return this.images[this.thumbnailIndex] || this.images[0];
  }
  return '';
});

carSchema.set('toJSON', { virtuals: true });
carSchema.set('toObject', { virtuals: true });

export const Car = mongoose.model('Car', carSchema);
