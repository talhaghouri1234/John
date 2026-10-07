import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  MONGO_URI: z.string().regex(/^mongodb(?:\+srv)?:\/\//),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES: z.string().regex(/^\d+[smhd]$/).default('15m'),
  JWT_REFRESH_EXPIRES: z.string().regex(/^\d+[smhd]$/).default('7d'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
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
  return result.data;
}

export const env = loadEnv();
