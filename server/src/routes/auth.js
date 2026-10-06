import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { register, login, refresh, logout, getMe } from '../controllers/auth.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validators/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();
router.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { success: false, message: 'Too many authentication requests. Try again later.' },
}));
router.post('/register', validate(registerSchema), asyncHandler(register));
router.post('/login', validate(loginSchema), asyncHandler(login));
router.post('/refresh', asyncHandler(refresh));
router.post('/logout', asyncHandler(logout));
router.get('/me', protect, getMe);
export default router;
