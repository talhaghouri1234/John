import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { register, login, refresh, logout, getMe } from '../controllers/auth.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validators/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { forgotPassword, resetPassword, verifyEmail } from '../controllers/account.js';
import { forgotSchema, resetSchema, verifySchema } from '../validators/account.js';

const router = Router();
router.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { success: false, message: 'Too many authentication requests. Try again later.' },
}));
router.post('/register', validate(registerSchema), asyncHandler(register));
router.post('/login', validate(loginSchema), asyncHandler(login));
router.post('/refresh', asyncHandler(refresh));
router.post('/logout', asyncHandler(logout));
router.get('/me', protect, getMe);
const recoveryLimit = rateLimit({ windowMs: 15 * 60000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { success: false, message: 'Too many recovery requests. Try again later.' } });
router.post('/forgot-password', recoveryLimit, validate(forgotSchema), asyncHandler(forgotPassword));
router.post('/reset-password', recoveryLimit, validate(resetSchema), asyncHandler(resetPassword));
router.post('/verify-email', recoveryLimit, validate(verifySchema), asyncHandler(verifyEmail));
export default router;
