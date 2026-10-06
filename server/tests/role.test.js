import { test, expect } from '@jest/globals';
import { session } from './helpers.js';

test('user cannot list users or mutate categories', async () => {
  const { agent } = await session('user');
  expect((await agent.get('/api/users')).status).toBe(403);
  expect((await agent.post('/api/categories').send({ name: 'Books' })).status).toBe(403);
  expect((await agent.put('/api/categories/507f1f77bcf86cd799439011').send({ name: 'Books' })).status).toBe(403);
  expect((await agent.delete('/api/categories/507f1f77bcf86cd799439011')).status).toBe(403);
});

test('admin can manage users and disabled access takes effect immediately', async () => {
  const { agent } = await session('admin');
  const { user, agent: userAgent } = await session('user');
  const list = await agent.get('/api/users');
  expect(list.status).toBe(200);
  expect(list.body.pagination.total).toBe(2);
  expect(list.body.users.every((item) => item.password === undefined)).toBe(true);
  expect((await agent.patch(`/api/users/${user.id}/role`).send({ role: 'admin' })).status).toBe(200);
  expect((await userAgent.get('/api/users')).status).toBe(200);
  expect((await agent.patch(`/api/users/${user.id}/active`).send({ isActive: false })).status).toBe(200);
  expect((await userAgent.get('/api/auth/me')).status).toBe(401);
  expect((await agent.delete(`/api/users/${user.id}`)).status).toBe(200);
  expect((await agent.delete(`/api/users/${user.id}`)).status).toBe(404);
});
