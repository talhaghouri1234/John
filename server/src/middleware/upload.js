import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import ApiError from '../utils/ApiError.js';

export const MAX_MEDIA_BYTES = 25 * 1024 * 1024;
export const mediaTypes = {
  'image/jpeg': 'image', 'image/png': 'image', 'image/webp': 'image', 'image/gif': 'image',
  'video/mp4': 'video', 'video/webm': 'video',
  'application/pdf': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'document',
};
const parse = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_MEDIA_BYTES, files: 1, fields: 0, parts: 1 },
  fileFilter: (_req, file, callback) => callback(
    mediaTypes[file.mimetype] ? null : new ApiError(415, 'Unsupported file type'), true,
  ),
}).single('file');

export function uploadMedia(req, res, next) {
  parse(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      return next(new ApiError(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400,
        error.code === 'LIMIT_FILE_SIZE' ? 'File must be 25 MB or smaller' : 'Upload exactly one file in the file field'));
    }
    next(error);
  });
}

export async function inspectMedia(file) {
  if (!file?.size) throw new ApiError(400, 'Choose a non-empty file');
  let type;
  try { type = await fileTypeFromBuffer(file.buffer); } catch { /* Truncated or invalid binary. */ }
  if (!type || !mediaTypes[type.mime] || type.mime !== file.mimetype) {
    throw new ApiError(415, 'File contents do not match a supported file type');
  }
  return { ...type, kind: mediaTypes[type.mime] };
}
