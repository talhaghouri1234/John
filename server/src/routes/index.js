import { Router } from 'express';
import authRoutes from './auth.js';
import userRoutes from './user.js';

const router = Router();
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.get('/health', (_req, res) => res.json({ success: true, message: 'API is healthy' }));
export default router;
