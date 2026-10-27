import multer from 'multer';
import path from 'node:path';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { fileTypeFromBuffer } from 'file-type';
import ApiError from '../utils/ApiError.js';

// Public menu photos must never share the private media library directory.
export const uploadsDir = fileURLToPath(new URL('../../uploads/menu/', import.meta.url));
const parse = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 10, parts: 11 },
}).fields([{ name: 'image', maxCount: 1 }, { name: 'foodImage', maxCount: 1 }, { name: 'file', maxCount: 1 }]);

export function handleImageUpload(req, res, next) {
  if (!req.is('multipart/form-data')) return next();
  parse(req, res, async (error) => {
    if (error) return next(new ApiError(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400,
      error.code === 'LIMIT_FILE_SIZE' ? 'Image must be 10MB or smaller' : 'Upload one image file'));
    try {
      const file = req.files?.image?.[0] || req.files?.foodImage?.[0] || req.files?.file?.[0];
      if (file) {
        let type;
        try { type = await fileTypeFromBuffer(file.buffer); } catch { /* Invalid image. */ }
        if (!type || !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(type.mime)) {
          throw new ApiError(415, 'Choose a valid JPEG, PNG, WebP or GIF image');
        }
        const filename = `${randomUUID()}.${type.ext}`;
        await mkdir(uploadsDir, { recursive: true });
        const destination = path.join(uploadsDir, filename);
        await writeFile(destination, file.buffer, { flag: 'wx' });
        // Validation/database errors must not leave unused uploads behind.
        res.on('finish', () => {
          if (res.statusCode >= 400) unlink(destination).catch(() => {});
        });
        req.body.image = `/uploads/${filename}`;
      }
      if (typeof req.body.price === 'string' && req.body.price.trim() !== '') {
        req.body.price = Number(req.body.price);
      }
      for (const field of ['isActive', 'isAvailable']) {
        if (req.body[field] === 'true') req.body[field] = true;
        if (req.body[field] === 'false') req.body[field] = false;
      }
      next();
    } catch (err) { next(err); }
  });
}
