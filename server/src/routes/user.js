import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';
import validate from '../middleware/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import { listUsers, updateRole, updateActive, deleteUser } from '../controllers/user.js';
import { listUsersSchema, roleSchema, activeSchema, deleteUserSchema } from '../validators/user.js';

const router = Router();
router.use(protect, authorize('admin'));
router.get('/', validate(listUsersSchema), asyncHandler(listUsers));
router.patch('/:id/role', validate(roleSchema), asyncHandler(updateRole));
router.patch('/:id/active', validate(activeSchema), asyncHandler(updateActive));
router.delete('/:id', validate(deleteUserSchema), asyncHandler(deleteUser));
export default router;
