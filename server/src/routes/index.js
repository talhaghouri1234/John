import { Router } from 'express';
import authRoutes from './auth.js';
import userRoutes from './user.js';
import categoryRoutes from './category.js';
import mediaRoutes from './media.js';

const router = Router();
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/media', mediaRoutes);
router.get('/health', (_req, res) => res.json({ success: true, message: 'API is healthy' }));
export default router;
