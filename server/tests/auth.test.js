import { test, expect } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';

const account = { name: 'Test User', email: 'test@example.com', password: 'Password123!' };

test('register creates a hashed user and httpOnly cookies without exposing credentials', async () => {
  const response = await request(app).post('/api/auth/register').send(account);
  expect(response.status).toBe(201);
  expect(response.body.user.role).toBe('user');
  expect(response.body.user.password).toBeUndefined();
  expect(response.body.user.refreshTokenHash).toBeUndefined();
  expect(response.headers['set-cookie']).toHaveLength(2);
  expect(response.headers['set-cookie'].every((cookie) => cookie.includes('HttpOnly') && cookie.includes('SameSite=Lax'))).toBe(true);
  const stored = await User.findOne({ email: account.email }).select('+password');
  expect(stored.password).not.toBe(account.password);
  expect(await stored.comparePassword(account.password)).toBe(true);
});

test('duplicate email and invalid registration produce consistent errors', async () => {
  await request(app).post('/api/auth/register').send(account);
  expect((await request(app).post('/api/auth/register').send(account)).status).toBe(409);
  const invalid = await request(app).post('/api/auth/register').send({ ...account, email: 'invalid' });
  expect(invalid.status).toBe(400);
  expect(invalid.body.errors.length).toBeGreaterThan(0);
});

test('login accepts valid credentials and rejects wrong password and inactive users', async () => {
  const user = await User.create(account);
  expect((await request(app).post('/api/auth/login').send(account)).status).toBe(400);
  const credentials = { email: account.email, password: account.password };
  expect((await request(app).post('/api/auth/login').send(credentials)).status).toBe(200);
  expect((await request(app).post('/api/auth/login').send({ ...credentials, password: 'wrong' })).status).toBe(401);
  user.isActive = false;
  await user.save();
  expect((await request(app).post('/api/auth/login').send(credentials)).status).toBe(401);
});
