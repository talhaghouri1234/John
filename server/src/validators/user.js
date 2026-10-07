import { z } from 'zod';

export const idParams = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier') });
export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(100).default(''),
});
export const listUsersSchema = z.object({ query: paginationQuery.strict() });
export const roleSchema = z.object({ params: idParams, body: z.object({ role: z.enum(['admin', 'user']) }).strict() });
export const activeSchema = z.object({ params: idParams, body: z.object({ isActive: z.boolean() }).strict() });
export const deleteUserSchema = z.object({ params: idParams });
