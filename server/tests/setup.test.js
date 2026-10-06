import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/isolated-tests';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-with-at-least-32-characters';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-with-at-least-32-characters';

const { default: app } = await import('../src/app.js');
const { default: request } = await import('supertest');

test('health route returns JSON with security headers', async () => {
  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
});

test('unknown route returns a consistent 404', async () => {
  const response = await request(app).get('/api/missing');
  assert.equal(response.status, 404);
  assert.equal(response.body.success, false);
});

test('malformed JSON produces a safe client error', async () => {
  const response = await request(app).post('/api/missing').set('Content-Type', 'application/json').send('{');
  assert.equal(response.status, 400);
  assert.equal(response.body.message, 'Invalid JSON body');
});
