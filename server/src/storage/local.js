import { mkdir, writeFile, unlink, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import ApiError from '../utils/ApiError.js';

const defaultRoot = fileURLToPath(new URL('../../uploads/', import.meta.url));

export function createLocalStorage(root = defaultRoot) {
  const directory = path.resolve(root);
  const resolveKey = (key) => {
    if (!/^[a-f0-9-]{36}\.[a-z0-9]+$/.test(key)) throw new ApiError(400, 'Invalid storage key');
    return path.join(directory, key);
  };
  return {
    async save({ buffer, extension }) {
      const key = `${randomUUID()}.${extension}`;
      await mkdir(directory, { recursive: true });
      await writeFile(resolveKey(key), buffer, { flag: 'wx', mode: 0o600 });
      return key;
    },
    async remove(key) {
      try { await unlink(resolveKey(key)); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
    },
    async send(req, res, media) {
      const filename = resolveKey(media.key);
      try { await stat(filename); }
      catch (error) { if (error.code === 'ENOENT') throw new ApiError(404, 'Media file not found'); throw error; }
      res.set('Cache-Control', 'private, no-store');
      res.set('Content-Type', media.mimeType);
      res.set('Content-Security-Policy', "default-src 'none'; sandbox");
      // Documents always download. Images/videos may be previewed; sendFile supports ranges.
      res.set('Content-Disposition', `${media.kind === 'document' || req.query.download === '1' ? 'attachment' : 'inline'}; filename="${media.key}"`);
      await new Promise((resolve, reject) => {
        res.sendFile(filename, { cacheControl: false }, (error) => error ? reject(error) : resolve());
      });
    },
  };
}
