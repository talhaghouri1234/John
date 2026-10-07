import { createLocalStorage } from './local.js';

// Replace or extend this registry with an R2 adapter implementing save/remove/send.
// Persist the provider per record so older local uploads stay readable during migration.
export const storage = createLocalStorage(process.env.MEDIA_UPLOAD_DIR || undefined);
export function storageFor(provider) {
  if (provider !== 'local') throw new Error('Unsupported storage provider');
  return storage;
}
export const uploadProvider = 'local';
