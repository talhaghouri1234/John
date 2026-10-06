import { test, expect } from '@jest/globals';
import { session } from './helpers.js';
import Category from '../src/models/Category.js';

test('user can search, paginate, sort and filter categories', async () => {
  const { user } = await session('admin');
  const { agent } = await session('user');
  await Category.create([
    { name: 'Books', createdBy: user.id },
    { name: 'Bookcases', createdBy: user.id, isActive: false },
    { name: 'Sports', createdBy: user.id },
  ]);
  const page = await agent.get('/api/categories?page=2&limit=1&sort=name');
  expect(page.status).toBe(200);
  expect(page.body.pagination).toEqual({ page: 2, limit: 1, total: 3, pages: 3 });
  expect(page.body.categories[0].name).toBe('Books');
  expect((await agent.get('/api/categories?search=book')).body.pagination.total).toBe(2);
  expect((await agent.get('/api/categories?isActive=false')).body.categories[0].name).toBe('Bookcases');
  expect((await agent.get('/api/categories?search=.*')).body.pagination.total).toBe(0);
  expect((await agent.get('/api/categories?page=0')).status).toBe(400);
});
