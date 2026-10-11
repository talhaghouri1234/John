import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  payload: { type: String, required: true, select: false },
  attempts: { type: Number, default: 0 },
  availableAt: { type: Date, default: Date.now },
  leaseUntil: { type: Date, default: () => new Date(0) },
  expiresAt: { type: Date, required: true, expires: 0 },
}, { timestamps: true });
schema.index({ availableAt: 1, leaseUntil: 1 });
export default mongoose.model('EmailJob', schema);
