import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, select: false },
  authVersion: { type: Number, required: true },
  userAgent: { type: String, maxlength: 300 },
  lastUsedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, expires: 0 },
}, { timestamps: true });
export default mongoose.model('Session', schema);
