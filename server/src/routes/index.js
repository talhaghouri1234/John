import { Router } from 'express';
import authRoutes from './auth.js';

const router = Router();
router.use('/auth', authRoutes);
router.get('/health', (_req, res) => res.json({ success: true, message: 'API is healthy' }));
export default router;
