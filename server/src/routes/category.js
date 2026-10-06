import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';
import validate from '../middleware/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import { listCategories, createCategory, updateCategory, deleteCategory } from '../controllers/category.js';
import { listCategoriesSchema, createCategorySchema, updateCategorySchema, deleteCategorySchema } from '../validators/category.js';

const router = Router();
router.use(protect);
router.get('/', validate(listCategoriesSchema), asyncHandler(listCategories));
router.post('/', authorize('admin'), validate(createCategorySchema), asyncHandler(createCategory));
router.put('/:id', authorize('admin'), validate(updateCategorySchema), asyncHandler(updateCategory));
router.delete('/:id', authorize('admin'), validate(deleteCategorySchema), asyncHandler(deleteCategory));
export default router;
