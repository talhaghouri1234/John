import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 160 },
  kind: { type: String, enum: ['image', 'video', 'document'], required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  key: { type: String, required: true, select: false },
  provider: { type: String, required: true, default: 'local', select: false },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
mediaSchema.index({ createdAt: -1, _id: -1 });
export default mongoose.model('Media', mediaSchema);
