import { Router } from 'express';
import multer from 'multer';
import { rateLimit } from 'express-rate-limit';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import * as controller from '../controllers/account.js';
import * as schema from '../validators/account.js';

const router = Router();
router.use(protect);
const sensitive = rateLimit({ windowMs: 15 * 60000, limit: 20, keyGenerator: (req) => String(req.user._id),
  standardHeaders: 'draft-8', legacyHeaders: false,
  message: { success: false, message: 'Too many account changes. Try again later.' } });
router.patch('/profile', validate(schema.profileSchema), asyncHandler(controller.updateProfile));
router.post('/change-password', sensitive, validate(schema.passwordSchema), asyncHandler(controller.changePassword));
router.post('/change-email', sensitive, validate(schema.emailSchema), asyncHandler(controller.changeEmail));
router.delete('/pending-email', sensitive, asyncHandler(controller.cancelEmailChange));
router.post('/resend-verification', sensitive, asyncHandler(controller.resendVerification));
router.get('/sessions', asyncHandler(controller.listSessions));
router.delete('/sessions/others', asyncHandler(controller.revokeOtherSessions));
router.delete('/sessions/:id', validate(schema.sessionSchema), asyncHandler(controller.revokeSession));
const parseAvatar = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 0, parts: 1 } }).single('file');
router.post('/avatar', sensitive, (req, res, next) => parseAvatar(req, res, (error) => {
  if (error) return next(new ApiError(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400, 'Upload one image, no larger than 2 MB'));
  next();
}), asyncHandler(controller.uploadAvatar));
router.get('/avatar', asyncHandler(controller.getAvatar));
router.delete('/avatar', asyncHandler(controller.deleteAvatar));
export default router;
