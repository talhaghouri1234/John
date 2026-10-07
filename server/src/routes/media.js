import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';
import validate from '../middleware/validate.js';
import { uploadMedia } from '../middleware/upload.js';
import asyncHandler from '../utils/asyncHandler.js';
import { listMedia, createMedia, sendMedia, deleteMedia } from '../controllers/media.js';

const router = Router();
const id = validate(z.object({ params: z.object({ id: z.string().regex(/^[a-f\d]{24}$/i) }) }));
router.use(protect);
router.get('/', validate(z.object({ query: z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(24).default(6),
  search: z.string().trim().max(120).default(''),
  kind: z.enum(['image', 'video', 'document']).optional(),
}).strict() })), asyncHandler(listMedia));
router.post('/', authorize('admin'), rateLimit({
  windowMs: 60_000, limit: 10, keyGenerator: (req) => req.user.id,
  standardHeaders: 'draft-8', legacyHeaders: false,
  message: { success: false, message: 'Too many uploads. Please wait a minute.' },
}), uploadMedia, asyncHandler(createMedia));
router.get('/:id/file', id, asyncHandler(sendMedia));
router.delete('/:id', authorize('admin'), id, asyncHandler(deleteMedia));
export default router;
