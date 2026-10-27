import { test, expect } from '@jest/globals';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { session } from './helpers.js';
import request from './request.js';
import app from '../src/app.js';
import { uploadsDir } from '../src/middleware/uploadImage.js';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=', 'base64');

test('multipart category and food CRUD stores and serves images and protects category references', async () => {
  const { agent } = await session('admin');
  const images = [];
  try {
    const category = await agent.post('/api/categories').field('name', 'Starters').field('description', 'Small plates').attach('image', png, 'starter.png');
    expect(category.status).toBe(201);
    const categoryId = category.body.category._id;
    images.push(category.body.category.image);
    const editedCategory = await agent.put(`/api/categories/${categoryId}`).field('description', 'Fresh small plates').attach('image', png, 'new-starter.png');
    expect(editedCategory.status).toBe(200);
    expect(editedCategory.body.category.description).toBe('Fresh small plates');
    images.push(editedCategory.body.category.image);
    const food = await agent.post('/api/foods').field('name', 'Soup').field('price', '4.50').field('category', categoryId).attach('image', png, 'soup.png');
    expect(food.status).toBe(201);
    expect(food.body.food.price).toBe(4.5);
    expect(food.body.food.category._id).toBe(categoryId);
    images.push(food.body.food.image);
    for (const image of images) {
      const response = await request(app).get(image);
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/image\/png/);
    }
    expect((await request(app).get('/api/menu/categories')).body.categories[0]._id).toBe(categoryId);
    expect((await request(app).get('/api/foods?category=missing-slug')).body.foods).toEqual([]);
    expect((await agent.delete(`/api/categories/${categoryId}`)).status).toBe(409);
    const edited = await agent.put(`/api/foods/${food.body.food._id}`).field('price', '6.25').attach('image', png, 'new.png');
    expect(edited.status).toBe(200);
    expect(edited.body.food.price).toBe(6.25);
    images.push(edited.body.food.image);
    expect((await agent.delete(`/api/foods/${food.body.food._id}`)).status).toBe(200);
    expect((await agent.delete(`/api/categories/${categoryId}`)).status).toBe(200);
  } finally {
    await Promise.all(images.map((image) => unlink(path.join(uploadsDir, path.basename(image))).catch(() => {})));
  }
});

test('invalid prices, fake images and non-admin writes are rejected', async () => {
  const { agent } = await session('admin');
  const category = await agent.post('/api/categories').send({ name: 'Desserts' });
  const categoryId = category.body.category._id;
  for (const price of ['', ' ', null, true, -1, 'abc']) {
    expect((await agent.post('/api/foods').send({ name: 'Cake', price, category: categoryId })).status).toBe(400);
  }
  expect((await agent.post('/api/foods').field('name', 'Cake').field('price', '').field('category', categoryId)).status).toBe(400);
  expect((await agent.post('/api/categories').field('name', 'Fake').attach('image', Buffer.from('<script>alert(1)</script>'), 'fake.png')).status).toBe(415);
  const { agent: viewer } = await session('user');
  expect((await viewer.post('/api/foods').send({ name: 'Cake', price: 3, category: categoryId })).status).toBe(403);
  expect((await viewer.put(`/api/foods/${categoryId}`).send({ price: 3 })).status).toBe(403);
  expect((await viewer.delete(`/api/foods/${categoryId}`)).status).toBe(403);
  expect((await request(app).post('/api/foods').send({})).status).toBe(401);
});
