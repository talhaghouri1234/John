import Category from '../models/Category.js';
import escapeRegex from '../utils/escapeRegex.js';
import ApiError from '../utils/ApiError.js';
import { audit } from '../utils/audit.js';

export async function listCategories(req, res) {
  const { page, limit, search, sort, isActive } = req.query;
  const filter = {};
  if (search) filter.name = { $regex: escapeRegex(search), $options: 'i' };
  if (isActive !== undefined) filter.isActive = isActive;
  const order = { [sort.replace(/^-/, '')]: sort.startsWith('-') ? -1 : 1, _id: 1 };
  const [categories, total] = await Promise.all([
    Category.find(filter).sort(order).skip((page - 1) * limit).limit(limit),
    Category.countDocuments(filter),
  ]);
  res.json({ success: true, message: 'Categories retrieved', categories, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function createCategory(req, res) {
  const category = await Category.create({ ...req.body, createdBy: req.user._id });
  await audit(req, 'category.create', category._id);
  res.status(201).json({ success: true, message: 'Category created', category });
}

export async function updateCategory(req, res) {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  Object.assign(category, req.body);
  await category.save();
  await audit(req, 'category.update', category._id);
  res.json({ success: true, message: 'Category updated', category });
}

export async function deleteCategory(req, res) {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  await audit(req, 'category.delete', category._id);
  res.json({ success: true, message: 'Category deleted' });
}
