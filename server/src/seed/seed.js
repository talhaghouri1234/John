import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { env } from '../config/env.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import { sampleUsers } from './users.js';
import { sampleCategories } from './categories.js';

async function run() {
  if (env.NODE_ENV === 'production') throw new Error('Demo seed is disabled in production');
  await connectDB();
  await Promise.all([User.init(), Category.init()]);
  await Category.deleteMany({});
  await User.deleteMany({});
  // create() runs password hashing middleware, unlike insertMany().
  const [admin] = await User.create(sampleUsers);
  await Category.create(sampleCategories.map((category) => ({ ...category, createdBy: admin._id })));
  console.log('Seeded 3 demonstration accounts and 10 categories.');
  for (const user of sampleUsers) console.log(`${user.role}: ${user.email} / ${user.password}`);
}

try {
  await run();
} catch {
  // Driver errors can contain a connection URI, so keep diagnostics generic.
  console.error('Seed failed. Check the environment, database access, and NODE_ENV.');
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
