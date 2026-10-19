import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['booking', 'fleet', 'user', 'payment', 'settings', 'pricing', 'security', 'system'],
    default: 'booking',
  },
  details: {
    type: String,
    required: true,
  },
  targetId: {
    type: String,
    default: '',
  },
  performedBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, default: 'Admin' },
    email: { type: String, default: 'admin@veloce.io' },
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
