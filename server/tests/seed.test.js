import { test } from '@jest/globals';
import assert from 'node:assert/strict';
import { sampleUsers } from '../src/seed/users.js';
import { sampleCategories } from '../src/seed/categories.js';
import { parseSeedOptions } from '../src/seed/options.js';
import User from '../src/models/User.js';
import Category from '../src/models/Category.js';

test('seed fixtures contain one admin, two users, and ten valid categories', async () => {
  assert.equal(sampleUsers.length, 3);
  assert.equal(sampleUsers.filter((user) => user.role === 'admin').length, 1);
  assert.equal(new Set(sampleUsers.map((user) => user.email)).size, 3);
  for (const data of sampleUsers) await new User(data).validate();
  assert.equal(sampleCategories.length, 10);
  assert.equal(new Set(sampleCategories.map((category) => category.name)).size, 10);
  for (const data of sampleCategories) {
    const category = new Category({ ...data, createdBy: '507f1f77bcf86cd799439011' });
    await category.validate();
    assert.ok(category.slug);
  }
});

test('seed options distinguish creation from destruction and reject unsafe invocation', () => {
  assert.deepEqual(parseSeedOptions([], 'development'), { destroy: false });
  assert.deepEqual(parseSeedOptions(['--destroy'], 'development'), { destroy: true });
  assert.throws(() => parseSeedOptions(['--unknown'], 'development'));
  assert.throws(() => parseSeedOptions([], 'production'));
  assert.throws(() => parseSeedOptions(['--destroy'], 'production'));
});
