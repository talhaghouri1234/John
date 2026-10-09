import 'dotenv/config';
import { z } from 'zod';

const frontendOrigin = z.string().trim().url().refine((value) => {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && url.pathname === '/' &&
      !url.search && !url.hash && !url.username && !url.password;
  } catch { return false; }
}).transform((value) => new URL(value).origin);

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  MONGO_URI: z.string().regex(/^mongodb(?:\+srv)?:\/\//),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES: z.string().regex(/^\d+[smhd]$/).default('15m'),
  JWT_REFRESH_EXPIRES: z.string().regex(/^\d+[smhd]$/).default('7d'),
  CLIENT_URL: frontendOrigin.default('http://localhost:5173'),
  CLIENT_ORIGINS: z.string().default('').transform((value) => value.trim() ? value.split(',') : [])
    .pipe(z.array(frontendOrigin)),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).optional(),
});

// Validate at startup; never include environment values in validation errors.
export function loadEnv(source = process.env) {
  const result = schema.safeParse(source);
  if (!result.success) {
    throw new Error(`Invalid environment: ${result.error.issues.map((i) => i.path.join('.')).join(', ')}`);
  }
  if (result.data.JWT_ACCESS_SECRET === result.data.JWT_REFRESH_SECRET) {
    throw new Error('JWT secrets must be different');
  }
  const config = result.data;
  config.CLIENT_ORIGINS = [...new Set([config.CLIENT_URL, ...config.CLIENT_ORIGINS])];
  config.COOKIE_SAME_SITE ??= config.NODE_ENV === 'production' ? 'none' : 'lax';
  if (config.NODE_ENV === 'production' && config.CLIENT_ORIGINS.some((origin) => !origin.startsWith('https://'))) {
    throw new Error('Invalid environment: production frontend origins must use HTTPS');
  }
  if (config.COOKIE_SAME_SITE === 'none' && config.NODE_ENV !== 'production') {
    throw new Error('Invalid environment: COOKIE_SAME_SITE=none requires NODE_ENV=production and HTTPS');
  }
  return config;
}

export const env = loadEnv();
