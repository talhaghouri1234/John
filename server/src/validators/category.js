import { z } from 'zod';
import { idParams, paginationQuery } from './user.js';

const fields = {
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(2000).default(''),
  image: z.union([z.literal(''), z.string().url().refine((v) => /^https?:\/\//.test(v), 'Use an HTTP or HTTPS URL')]).default(''),
  isActive: z.boolean().default(true),
};
export const createCategorySchema = z.object({ body: z.object(fields).strict() });
export const updateCategorySchema = z.object({ params: idParams, body: z.object(fields).partial().strict().refine((v) => Object.keys(v).length > 0, 'At least one field is required') });
export const deleteCategorySchema = z.object({ params: idParams });
export const listCategoriesSchema = z.object({ query: paginationQuery.extend({
  sort: z.enum(['name', '-name', 'createdAt', '-createdAt']).default('-createdAt'),
  isActive: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
}).strict() });
