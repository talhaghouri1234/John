import Category from '../models/Category.js';
import escapeRegex from '../utils/escapeRegex.js';

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
