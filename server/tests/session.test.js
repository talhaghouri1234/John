import { test, expect } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';

const account = { name: 'Session User', email: 'session@example.com', password: 'Password123!' };
const refreshCookie = (response) => response.headers['set-cookie'].find((cookie) => cookie.startsWith('refreshToken=')).split(';')[0];

test('session loads current user and rotates refresh tokens with replay rejection', async () => {
  const agent = request.agent(app);
  const registration = await agent.post('/api/auth/register').send(account);
  const original = refreshCookie(registration);
  expect((await agent.get('/api/auth/me')).body.user.email).toBe(account.email);
  const refreshed = await agent.post('/api/auth/refresh');
  expect(refreshed.status).toBe(200);
  expect(refreshCookie(refreshed)).not.toBe(original);
  expect((await request(app).post('/api/auth/refresh').set('Cookie', original)).status).toBe(401);
  expect((await agent.get('/api/auth/me')).status).toBe(200);
});

test('logout revokes refresh token and clears the browser session', async () => {
  const agent = request.agent(app);
  const registration = await agent.post('/api/auth/register').send(account);
  expect((await agent.post('/api/auth/logout')).status).toBe(200);
  expect((await agent.get('/api/auth/me')).status).toBe(401);
  expect((await request(app).post('/api/auth/refresh').set('Cookie', refreshCookie(registration))).status).toBe(401);
});

test('only one concurrent refresh can consume a token', async () => {
  const registration = await request(app).post('/api/auth/register').send(account);
  const cookie = refreshCookie(registration);
  const responses = await Promise.all([1, 2].map(() => request(app).post('/api/auth/refresh').set('Cookie', cookie)));
  expect(responses.map((response) => response.status).sort()).toEqual([200, 401]);
});
