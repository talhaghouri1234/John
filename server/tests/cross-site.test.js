import { test, expect } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import User from '../src/models/User.js';

// This suite runs the actual app with production cookie settings, against the
// disposable database from setup.js. Supertest does not emulate browser policy.
process.env.NODE_ENV = 'production';
process.env.CLIENT_URL = 'https://myapp.vercel.app';
process.env.CLIENT_ORIGINS = 'https://myapp.netlify.app';
const { default: app } = await import('../src/app.js');
const { env, loadEnv } = await import('../src/config/env.js');
const origin = 'https://myapp.vercel.app';
const headers = { Origin: origin, 'X-CSRF-Protection': '1', 'Sec-Fetch-Site': 'cross-site' };
const account = { name: 'Cross Site User', email: 'cross@example.com', password: 'Password123!' };
const cookies = (response) => response.headers['set-cookie'].map((cookie) => cookie.split(';')[0]).join('; ');
const cookie = (response, name) => response.headers['set-cookie'].find((value) => value.startsWith(`${name}=`)).split(';')[0];

test('trusted production registration/login set private cross-site cookies and permit authenticated reads', async () => {
  const registered = await request(app).post('/api/auth/register').set(headers).send(account);
  expect(registered.status).toBe(201);
  const login = await request(app).post('/api/auth/login').set(headers).send({ email: account.email, password: account.password });
  expect(login.status).toBe(200);
  expect(login.body.user.password).toBeUndefined();
  expect(login.body.user.refreshTokenHash).toBeUndefined();
  expect(login.body.accessToken).toBeUndefined();
  expect(login.body.refreshToken).toBeUndefined();
  expect(login.headers['set-cookie']).toHaveLength(2);
  for (const value of login.headers['set-cookie']) {
    expect(value).toMatch(/HttpOnly/);
    expect(value).toMatch(/Secure/);
    expect(value).toMatch(/SameSite=None/);
    expect(value).toMatch(/Path=\//);
    expect(value).not.toMatch(/Domain=/);
  }
  const me = await request(app).get('/api/auth/me').set(headers).set('Cookie', cookies(login));
  expect(me.status).toBe(200);
  expect(me.headers['access-control-allow-origin']).toBe(origin);
  expect(me.headers['access-control-allow-credentials']).toBe('true');
  expect(me.body.user.email).toBe(account.email);
});

test('expired access refreshes, rotates once, and logout clears matching cookie attributes and revokes refresh', async () => {
  const user = await User.create(account);
  const login = await request(app).post('/api/auth/login').set(headers).send({ email: account.email, password: account.password });
  const expired = jwt.sign({ type: 'access' }, env.JWT_ACCESS_SECRET, {
    subject: String(user._id), issuer: 'mern-api', audience: 'mern-client', algorithm: 'HS256', expiresIn: -1,
  });
  const oldRefresh = cookie(login, 'refreshToken');
  const expiredSession = `accessToken=${expired}; ${oldRefresh}`;
  expect((await request(app).get('/api/auth/me').set(headers).set('Cookie', expiredSession)).status).toBe(401);
  const refreshed = await request(app).post('/api/auth/refresh').set(headers).set('Cookie', expiredSession);
  expect(refreshed.status).toBe(200);
  expect(cookie(refreshed, 'refreshToken')).not.toBe(oldRefresh);
  expect((await request(app).get('/api/auth/me').set(headers).set('Cookie', cookies(refreshed))).status).toBe(200);
  expect((await request(app).post('/api/auth/refresh').set(headers).set('Cookie', oldRefresh)).status).toBe(401);
  const logout = await request(app).post('/api/auth/logout').set(headers).set('Cookie', cookies(refreshed));
  expect(logout.status).toBe(200);
  for (const value of logout.headers['set-cookie']) {
    expect(value).toMatch(/=; Path=\//);
    expect(value).toMatch(/Expires=Thu, 01 Jan 1970/);
    expect(value).toMatch(/HttpOnly; Secure; SameSite=None/);
    expect(value).not.toMatch(/Domain=/);
  }
  expect((await request(app).post('/api/auth/refresh').set(headers).set('Cookie', cookie(refreshed, 'refreshToken'))).status).toBe(401);
});

test.each([origin, 'https://myapp.netlify.app'])('credentialed preflight permits only configured origin %s', async (trusted) => {
  const response = await request(app).options('/api/auth/login').set({
    Origin: trusted, 'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type,x-csrf-protection',
  });
  expect(response.status).toBe(204);
  expect(response.headers['access-control-allow-origin']).toBe(trusted);
  expect(response.headers['access-control-allow-credentials']).toBe('true');
  expect(response.headers['access-control-allow-headers'].toLowerCase()).toContain('x-csrf-protection');
  expect(response.headers.vary).toContain('Origin');
});

test('untrusted preflight and reads never receive credentialed CORS permission', async () => {
  for (const method of ['options', 'get']) {
    const response = await request(app)[method]('/api/auth/me').set('Origin', 'https://evil.example');
    expect(response.status).toBe(403);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  }
});

test.each([
  {},
  { 'X-CSRF-Protection': '1', 'Sec-Fetch-Site': 'same-origin' },
  { Origin: origin },
  { ...headers, 'X-CSRF-Protection': 'wrong' },
  { ...headers, Origin: 'null' },
  { ...headers, Origin: 'https://myapp.vercel.app.evil.example' },
  { ...headers, Origin: 'https://evil.example', Referer: `${origin}/` },
  { 'X-CSRF-Protection': '1', Referer: 'invalid' },
  { ...headers, 'Sec-Fetch-Mode': 'navigate' },
  { ...headers, 'Sec-Fetch-Dest': 'iframe' },
])('rejects forged/missing provenance or CSRF header without revoking a session: %j', async (forgedHeaders) => {
  await User.create(account);
  const login = await request(app).post('/api/auth/login').set(headers).send({ email: account.email, password: account.password });
  const rejected = await request(app).post('/api/auth/logout').set(forgedHeaders).set('Cookie', cookies(login));
  expect(rejected.status).toBe(403);
  expect((await request(app).post('/api/auth/refresh').set(headers).set('Cookie', cookie(login, 'refreshToken'))).status).toBe(200);
});

test('trusted Referer fallback requires the custom header when Origin is absent', async () => {
  expect((await request(app).post('/api/auth/logout').set({ Referer: `${origin}/user/dashboard`, 'X-CSRF-Protection': '1' })).status).toBe(200);
  expect((await request(app).post('/api/auth/logout').set('Referer', `${origin}/user/dashboard`)).status).toBe(403);
});

test('simple forms and multipart submissions cannot bypass CSRF checks', async () => {
  expect((await request(app).post('/api/auth/login').set('Origin', origin).type('form').send({ email: account.email })).status).toBe(403);
  const user = await User.create({ ...account, role: 'admin' });
  const login = await request(app).post('/api/auth/login').set(headers).send({ email: user.email, password: account.password });
  const session = cookies(login);
  const upload = () => request(app).post('/api/media').set('Cookie', session).set('Origin', origin);
  expect((await upload().attach('file', Buffer.from('bad'), 'file.png')).status).toBe(403);
  // With the header, the same request reaches actual file-signature validation.
  expect((await upload().set('X-CSRF-Protection', '1').set('Sec-Fetch-Site', 'cross-site').attach('file', Buffer.from('bad'), 'file.png')).status).toBe(415);
});

test('health checks remain available without cookies or browser headers', async () => {
  expect((await request(app).get('/api/health')).status).toBe(200);
});

test('origin/cookie environment configuration fails closed and retains local defaults', () => {
  const base = { ...process.env, CLIENT_ORIGINS: '' };
  expect(loadEnv(base).COOKIE_SAME_SITE).toBe('none');
  expect(loadEnv({ ...base, COOKIE_SAME_SITE: 'lax' }).COOKIE_SAME_SITE).toBe('lax');
  expect(loadEnv({ ...base, NODE_ENV: 'development', CLIENT_URL: 'http://localhost:5173' }).COOKIE_SAME_SITE).toBe('lax');
  expect(loadEnv({ ...base, CLIENT_ORIGINS: `${origin}/, https://myapp.netlify.app/` }).CLIENT_ORIGINS).toEqual([origin, 'https://myapp.netlify.app']);
  for (const value of ['*', 'null', 'not-a-url', `${origin}/path`, `${origin}?q=1`, `https://user:pass@myapp.vercel.app`, 'http://myapp.vercel.app']) {
    expect(() => loadEnv({ ...base, CLIENT_URL: value })).toThrow();
    expect(() => loadEnv({ ...base, CLIENT_ORIGINS: value })).toThrow();
  }
  expect(() => loadEnv({ ...base, NODE_ENV: 'development', COOKIE_SAME_SITE: 'none' })).toThrow();
  expect(() => loadEnv({ ...base, COOKIE_SAME_SITE: 'invalid' })).toThrow();
});
