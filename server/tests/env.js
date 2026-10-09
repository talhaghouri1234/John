import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Reuse an installed binary on Windows while still starting an isolated server.
const installations = join(process.env.ProgramFiles || 'C:/Program Files', 'MongoDB', 'Server');
if (!process.env.MONGOMS_SYSTEM_BINARY && process.platform === 'win32' && existsSync(installations)) {
  const version = readdirSync(installations).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
    .find((entry) => existsSync(join(installations, entry, 'bin', 'mongod.exe')));
  if (version) {
    process.env.MONGOMS_SYSTEM_BINARY = join(installations, version, 'bin', 'mongod.exe');
    process.env.MONGOMS_SYSTEM_BINARY_VERSION_CHECK = 'false';
  }
}

// Override before importing application code; tests never use the Atlas URI.
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/isolated-tests';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-with-at-least-32-characters';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-with-at-least-32-characters';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.CLIENT_ORIGINS = '';
delete process.env.COOKIE_SAME_SITE;
