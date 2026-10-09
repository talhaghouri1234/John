import { test } from '@jest/globals';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/isolated-tests';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-with-at-least-32-characters';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-with-at-least-32-characters';

const { default: app } = await import('../src/app.js');
const { default: request } = await import('./request.js');

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

test('auth rejects invalid registration and role injection', async () => {
  for (const body of [{}, { name: 'Test User', email: 'test@example.com', password: 'Password123', role: 'admin' }]) {
    const response = await request(app).post('/api/auth/register').send(body);
    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
  }
});

test('protected and refresh routes reject missing cookies', async () => {
  assert.equal((await request(app).get('/api/auth/me')).status, 401);
  assert.equal((await request(app).post('/api/auth/refresh')).status, 401);
});

test('logout clears cookies without a session', async () => {
  const response = await request(app).post('/api/auth/logout');
  assert.equal(response.status, 200);
  assert.equal(response.headers['set-cookie'].length, 2);
});

test('browser mutations from another origin are forbidden', async () => {
  const response = await request(app).post('/api/auth/logout').set('Origin', 'https://untrusted.example');
  assert.equal(response.status, 403);
});

test('refresh tokens are unique and cannot be used as access tokens', async () => {
  const { generateTokens, verifyToken } = await import('../src/utils/generateToken.js');
  const user = { _id: '507f1f77bcf86cd799439011' };
  const first = generateTokens(user);
  const second = generateTokens(user);
  assert.notEqual(first.refreshToken, second.refreshToken);
  assert.equal(verifyToken(first.accessToken, 'access').sub, user._id);
  assert.throws(() => verifyToken(first.refreshToken, 'access'));
});

test('user serialization excludes credentials', async () => {
  const { default: User } = await import('../src/models/User.js');
  const user = new User({ name: 'Test', email: 'test@example.com', password: 'secret', refreshTokenHash: 'hash' });
  assert.equal(user.toJSON().password, undefined);
  assert.equal(user.toJSON().refreshTokenHash, undefined);
});

test('role guard rejects users and accepts admins', async () => {
  const { authorize } = await import('../src/middleware/role.js');
  let error;
  authorize('admin')({ user: { role: 'user' } }, {}, (err) => { error = err; });
  assert.equal(error.statusCode, 403);
  authorize('admin')({ user: { role: 'admin' } }, {}, (err) => { error = err; });
  assert.equal(error, undefined);
});

test('user management requires authentication', async () => {
  assert.equal((await request(app).get('/api/users')).status, 401);
});

test('admin cannot revoke their own access', async () => {
  const { updateRole, updateActive, deleteUser } = await import('../src/controllers/user.js');
  for (const controller of [updateRole, updateActive, deleteUser]) {
    await assert.rejects(controller({ user: { _id: 'same-id' }, params: { id: 'same-id' } }, {}), { statusCode: 400 });
  }
});

test('user list validation bounds pagination and escapes searches literally', async () => {
  const { listUsersSchema } = await import('../src/validators/user.js');
  const { default: escapeRegex } = await import('../src/utils/escapeRegex.js');
  assert.equal(listUsersSchema.safeParse({ query: { page: '-1' } }).success, false);
  assert.equal(listUsersSchema.safeParse({ query: { limit: '101' } }).success, false);
  assert.equal(new RegExp(escapeRegex('a.*')).test('abc'), false);
  assert.equal(new RegExp(escapeRegex('a.*')).test('a.*'), true);
});

test('category slug generation follows name changes', async () => {
  const { default: Category } = await import('../src/models/Category.js');
  const category = new Category({ name: 'Home & Décor', createdBy: '507f1f77bcf86cd799439011' });
  await category.validate();
  assert.equal(category.slug, 'home-decor');
  category.name = 'New Books';
  await category.validate();
  assert.equal(category.slug, 'new-books');
});

test('category validation preserves omitted fields in partial updates', async () => {
  const { updateCategorySchema, createCategorySchema, listCategoriesSchema } = await import('../src/validators/category.js');
  const params = { id: '507f1f77bcf86cd799439011' };
  assert.deepEqual(updateCategorySchema.parse({ params, body: { name: 'Books' } }).body, { name: 'Books' });
  assert.equal(updateCategorySchema.safeParse({ params, body: {} }).success, false);
  assert.equal(createCategorySchema.safeParse({ body: { name: 'Books', image: 'javascript:alert(1)' } }).success, false);
  assert.equal(listCategoriesSchema.parse({ query: { isActive: 'false' } }).query.isActive, false);
  assert.equal(listCategoriesSchema.safeParse({ query: { sort: 'password' } }).success, false);
});

test('all category routes require a session', async () => {
  assert.equal((await request(app).get('/api/categories')).status, 401);
  assert.equal((await request(app).post('/api/categories').send({ name: 'Books' })).status, 401);
  assert.equal((await request(app).put('/api/categories/507f1f77bcf86cd799439011').send({ name: 'Books' })).status, 401);
  assert.equal((await request(app).delete('/api/categories/507f1f77bcf86cd799439011')).status, 401);
});
