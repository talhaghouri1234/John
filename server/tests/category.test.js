import { test, expect } from '@jest/globals';
import { session } from './helpers.js';

test('admin creates, edits and deletes categories while ownership and omitted fields persist', async () => {
  const { user, agent } = await session();
  const created = await agent.post('/api/categories').send({ name: 'Home Goods', description: 'Keep this', isActive: false });
  expect(created.status).toBe(201);
  expect(created.body.category.slug).toBe('home-goods');
  expect(created.body.category.createdBy).toBe(user.id);
  const id = created.body.category._id;
  const edited = await agent.put(`/api/categories/${id}`).send({ name: 'Home Decor' });
  expect(edited.status).toBe(200);
  expect(edited.body.category.slug).toBe('home-decor');
  expect(edited.body.category.description).toBe('Keep this');
  expect(edited.body.category.isActive).toBe(false);
  expect((await agent.delete(`/api/categories/${id}`)).status).toBe(200);
  expect((await agent.delete(`/api/categories/${id}`)).status).toBe(404);
  expect((await agent.put(`/api/categories/${id}`).send({ name: 'Missing' })).status).toBe(404);
});

test('category duplicates, invalid fields and identifiers are rejected', async () => {
  const { agent } = await session();
  await agent.post('/api/categories').send({ name: 'Books' });
  expect((await agent.post('/api/categories').send({ name: 'Books' })).status).toBe(409);
  expect((await agent.post('/api/categories').send({ name: '' })).status).toBe(400);
  expect((await agent.put('/api/categories/invalid').send({ name: 'Books' })).status).toBe(400);
  expect((await agent.post('/api/categories').send({ name: 'Books', createdBy: '507f1f77bcf86cd799439011' })).status).toBe(400);
});
