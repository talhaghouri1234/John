import mongoose from 'mongoose';

const foodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Food name is required'],
    trim: true,
    maxlength: [120, 'Food name cannot exceed 120 characters'],
  },
  price: {
    type: Number,
    required: [true, 'Food price is required'],
    min: [0, 'Price must be greater than or equal to 0'],
  },
  description: {
    type: String,
    default: '',
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category ID is required'],
    index: true,
  },
  image: {
    type: String,
    default: '',
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  collection: 'foods',
});

foodSchema.index({ name: 'text', description: 'text' });

export default mongoose.model('Food', foodSchema, 'foods');
