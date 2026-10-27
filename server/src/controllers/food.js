import Food from '../models/Food.js';
import Category from '../models/Category.js';
import escapeRegex from '../utils/escapeRegex.js';
import ApiError from '../utils/ApiError.js';
import { audit } from '../utils/audit.js';

export async function listFoods(req, res) {
  const { page = 1, limit = 10, search, category, sort = '-createdAt', isAvailable, all } = req.query;
  const filter = {};

  if (search) {
    const rx = { $regex: escapeRegex(search), $options: 'i' };
    filter.$or = [{ name: rx }, { description: rx }];
  }

  if (category) {
    if (/^[a-f\d]{24}$/i.test(category)) {
      filter.category = category;
    } else {
      const cat = await Category.findOne({ slug: category });
      filter.category = cat ? cat._id : null;
    }
  }

  if (isAvailable !== undefined) {
    filter.isAvailable = isAvailable;
  }

  const order = { [sort.replace(/^-/, '')]: sort.startsWith('-') ? -1 : 1, _id: 1 };

  if (all) {
    const foods = await Food.find(filter).sort(order).populate('category', 'name slug image');
    return res.json({
      success: true,
      message: 'Foods retrieved',
      foods,
      pagination: { page: 1, limit: foods.length, total: foods.length, pages: 1 },
    });
  }

  const [foods, total] = await Promise.all([
    Food.find(filter)
      .sort(order)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('category', 'name slug image'),
    Food.countDocuments(filter),
  ]);

  res.json({
    success: true,
    message: 'Foods retrieved',
    foods,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  });
}

export async function getFood(req, res) {
  const food = await Food.findById(req.params.id).populate('category', 'name slug image');
  if (!food) throw new ApiError(404, 'Food item not found');
  res.json({ success: true, message: 'Food item retrieved', food });
}

export async function createFood(req, res) {
  const categoryExists = await Category.findById(req.body.category);
  if (!categoryExists) throw new ApiError(404, 'Selected category does not exist');

  const food = await Food.create({
    ...req.body,
    ...(req.user?._id ? { createdBy: req.user._id } : {}),
  });

  await food.populate('category', 'name slug image');
  if (req.user) await audit(req, 'food.create', food._id);

  res.status(201).json({ success: true, message: 'Food item created', food });
}

export async function updateFood(req, res) {
  const food = await Food.findById(req.params.id);
  if (!food) throw new ApiError(404, 'Food item not found');

  if (req.body.category) {
    const categoryExists = await Category.findById(req.body.category);
    if (!categoryExists) throw new ApiError(404, 'Selected category does not exist');
  }

  Object.assign(food, req.body);
  await food.save();
  await food.populate('category', 'name slug image');

  if (req.user) await audit(req, 'food.update', food._id);

  res.json({ success: true, message: 'Food item updated', food });
}

export async function deleteFood(req, res) {
  const food = await Food.findByIdAndDelete(req.params.id);
  if (!food) throw new ApiError(404, 'Food item not found');

  if (req.user) await audit(req, 'food.delete', food._id);

  res.json({ success: true, message: 'Food item deleted' });
}
