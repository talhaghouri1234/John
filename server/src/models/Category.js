import mongoose from 'mongoose';

export function slugify(name) {
  return name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'category';
}

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
  slug: { type: String, required: true },
  description: { type: String, default: '', maxlength: 2000 },
  image: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

categorySchema.pre('validate', function () {
  if (this.isModified('name')) this.slug = slugify(this.name);
});

export default mongoose.model('Category', categorySchema);
