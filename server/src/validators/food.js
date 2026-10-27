import { z } from 'zod';
import { idParams, paginationQuery } from './user.js';

const fields = {
  name: z.string().trim().min(2, 'Food name must be at least 2 characters').max(120),
  price: z.number().finite().min(0, 'Price must be 0 or higher'),
  category: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid category ID'),
  description: z.string().trim().max(2000),
  image: z.union([
    z.literal(''),
    z.string().trim().refine((v) => !v || v.startsWith('/') || /^https?:\/\//.test(v), 'Use a valid image path or URL'),
  ]),
  isAvailable: z.boolean(),
};

export const createFoodSchema = z.object({
  body: z.object({
    name: fields.name,
    price: fields.price,
    category: fields.category,
    description: fields.description.default(''),
    image: fields.image.default(''),
    isAvailable: fields.isAvailable.default(true),
  }).strict(),
});

export const updateFoodSchema = z.object({
  params: idParams,
  body: z.object(fields).partial().strict().refine((v) => Object.keys(v).length > 0, 'At least one field is required'),
});

export const deleteFoodSchema = z.object({
  params: idParams,
});

export const getFoodSchema = z.object({
  params: idParams,
});

export const listFoodsSchema = z.object({
  query: paginationQuery.extend({
    category: z.string().optional(),
    isAvailable: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
    sort: z.enum(['name', '-name', 'price', '-price', 'createdAt', '-createdAt']).default('-createdAt'),
    all: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  }).strict(),
});
