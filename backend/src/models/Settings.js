import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: mongoose.Schema.Types.Mixed,
  category: { type: String, enum: ['company', 'pricing', 'policy', 'payment', 'general'], default: 'general' },
  label: String,
  description: String,
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export const Settings = mongoose.model('Settings', settingsSchema);
