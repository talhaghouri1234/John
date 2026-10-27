import { Router } from 'express';
import { protect, optionalProtect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';
import validate from '../middleware/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import { handleImageUpload } from '../middleware/uploadImage.js';
import {
  listFoods,
  getFood,
  createFood,
  updateFood,
  deleteFood,
} from '../controllers/food.js';
import {
  listFoodsSchema,
  getFoodSchema,
  createFoodSchema,
  updateFoodSchema,
  deleteFoodSchema,
} from '../validators/food.js';

const router = Router();

// Display / Read operations (accessible to public guests or authenticated users)
router.get('/', optionalProtect, validate(listFoodsSchema), asyncHandler(listFoods));
router.get('/:id', optionalProtect, validate(getFoodSchema), asyncHandler(getFood));

// Add, Edit, Delete operations (authenticated with JWT)
router.post(
  '/',
  protect,
  authorize('admin'),
  handleImageUpload,
  validate(createFoodSchema),
  asyncHandler(createFood),
);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  handleImageUpload,
  validate(updateFoodSchema),
  asyncHandler(updateFood),
);

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  validate(deleteFoodSchema),
  asyncHandler(deleteFood),
);

export default router;
