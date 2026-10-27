import { test, expect } from '@jest/globals';
import { session } from './helpers.js';
import Category from '../src/models/Category.js';

test('admin creates, reads, updates, and deletes food items', async () => {
  const { user, agent } = await session('admin');

  // Create a category first
  const category = await Category.create({
    name: 'Italian Pasta',
    description: 'Fresh pasta dishes',
    createdBy: user.id,
  });

  // 1. CREATE FOOD ITEM
  const createRes = await agent.post('/api/foods').send({
    name: 'Creamy Fettuccine Alfredo',
    price: 16.99,
    description: 'Rich parmesan cream sauce with garlic and fresh herbs',
    category: category._id.toString(),
    isAvailable: true,
  });

  expect(createRes.status).toBe(201);
  expect(createRes.body.food.name).toBe('Creamy Fettuccine Alfredo');
  expect(createRes.body.food.price).toBe(16.99);
  expect(createRes.body.food.category._id).toBe(category._id.toString());
  expect(createRes.body.food.category.name).toBe('Italian Pasta');

  const foodId = createRes.body.food._id;

  // 2. GET FOOD ITEM BY ID
  const getRes = await agent.get(`/api/foods/${foodId}`);
  expect(getRes.status).toBe(200);
  expect(getRes.body.food.name).toBe('Creamy Fettuccine Alfredo');
  expect(getRes.body.food.category.name).toBe('Italian Pasta');

  // 3. LIST FOOD ITEMS
  const listRes = await agent.get('/api/foods');
  expect(listRes.status).toBe(200);
  expect(listRes.body.foods.some((f) => f._id === foodId)).toBe(true);

  // 4. UPDATE FOOD ITEM
  const updateRes = await agent.put(`/api/foods/${foodId}`).send({
    name: 'Truffle Fettuccine Alfredo',
    price: 19.99,
  });
  expect(updateRes.status).toBe(200);
  expect(updateRes.body.food.name).toBe('Truffle Fettuccine Alfredo');
  expect(updateRes.body.food.price).toBe(19.99);
  expect(updateRes.body.food.description).toBe('Rich parmesan cream sauce with garlic and fresh herbs');

  // 5. DELETE FOOD ITEM
  const deleteRes = await agent.delete(`/api/foods/${foodId}`);
  expect(deleteRes.status).toBe(200);
  expect(deleteRes.body.message).toBe('Food item deleted');

  // Verify deletion
  const checkRes = await agent.get(`/api/foods/${foodId}`);
  expect(checkRes.status).toBe(404);
});

test('food validation rejects invalid price, missing name, or invalid category', async () => {
  const { user, agent } = await session('admin');

  const category = await Category.create({
    name: 'Grill & BBQ',
    description: 'Smoked meats',
    createdBy: user.id,
  });

  // Negative price should be rejected
  const negPrice = await agent.post('/api/foods').send({
    name: 'BBQ Ribs',
    price: -5,
    category: category._id.toString(),
  });
  expect(negPrice.status).toBe(400);

  // Missing price should be rejected
  const noPrice = await agent.post('/api/foods').send({
    name: 'BBQ Ribs',
    category: category._id.toString(),
  });
  expect(noPrice.status).toBe(400);

  // Missing name should be rejected
  const noName = await agent.post('/api/foods').send({
    name: '',
    price: 15,
    category: category._id.toString(),
  });
  expect(noName.status).toBe(400);

  // Non-existent category ID should return 404
  const fakeCat = await agent.post('/api/foods').send({
    name: 'Mystery Dish',
    price: 12,
    category: '507f1f77bcf86cd799439011',
  });
  expect(fakeCat.status).toBe(404);
});
