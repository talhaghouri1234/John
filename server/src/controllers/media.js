import Media from '../models/Media.js';
import { inspectMedia } from '../middleware/upload.js';
import { storageFor, uploadProvider } from '../storage/index.js';
import ApiError from '../utils/ApiError.js';
import escapeRegex from '../utils/escapeRegex.js';

export async function listMedia(req, res) {
  const { page, limit, search, kind } = req.query;
  const filter = { ...(kind ? { kind } : {}), ...(search ? { name: { $regex: escapeRegex(search), $options: 'i' } } : {}) };
  const [media, total] = await Promise.all([
    Media.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit),
    Media.countDocuments(filter),
  ]);
  res.json({ success: true, media, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function createMedia(req, res) {
  const type = await inspectMedia(req.file);
  const adapter = storageFor(uploadProvider);
  const key = await adapter.save({ buffer: req.file.buffer, extension: type.ext, mimeType: type.mime });
  let media;
  try {
    const name = req.file.originalname.replace(/[^\p{L}\p{N} ._()-]/gu, '_').slice(0, 160) || `Upload.${type.ext}`;
    media = await Media.create({ name, key, provider: uploadProvider, mimeType: type.mime,
      kind: type.kind, size: req.file.size, uploadedBy: req.user._id });
  } catch (error) {
    await adapter.remove(key);
    throw error;
  }
  const result = media.toObject();
  delete result.key; delete result.provider;
  res.status(201).json({ success: true, media: result });
}

async function findMedia(id) {
  const media = await Media.findById(id).select('+key +provider');
  if (!media) throw new ApiError(404, 'Media not found');
  return media;
}
export async function sendMedia(req, res) {
  const media = await findMedia(req.params.id);
  await storageFor(media.provider).send(req, res, media);
}
export async function deleteMedia(req, res) {
  const media = await findMedia(req.params.id);
  // Keep metadata on storage failure so deletion can be retried.
  await storageFor(media.provider).remove(media.key);
  await media.deleteOne();
  res.json({ success: true, message: 'Media deleted' });
}
