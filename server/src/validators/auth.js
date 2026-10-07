import { z } from 'zod';

const email = z.string().trim().toLowerCase().email().max(254);
const password = z.string().min(8).max(72).refine((v) => Buffer.byteLength(v, 'utf8') <= 72, 'Password must be at most 72 bytes');
export const registerSchema = z.object({ body: z.object({ name: z.string().trim().min(2).max(80), email, password }).strict() });
export const loginSchema = z.object({ body: z.object({ email, password: z.string().min(1).max(72) }).strict() });
