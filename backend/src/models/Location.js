import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  operatingHours: {
    type: String,
    default: '24/7 Concierge Handover'
  },
  phone: {
    type: String,
    default: '+91 98765 43210'
  },
  hubPin: {
    type: String,
    default: 'Bay 14'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export const Location = mongoose.model('Location', locationSchema);
