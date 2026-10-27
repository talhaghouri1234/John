import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { env } from '../config/env.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Food from '../models/Food.js';
import { sampleUsers } from './users.js';
import { sampleCategories } from './categories.js';
import { sampleFoods } from './foods.js';
import { parseSeedOptions } from './options.js';

async function run() {
  const { destroy } = parseSeedOptions(process.argv.slice(2), env.NODE_ENV);
  await connectDB();
  await Promise.all([User.init(), Category.init(), Food.init()]);
  await Food.deleteMany({});
  await Category.deleteMany({});
  await User.deleteMany({});
  if (destroy) { console.log('Users, categories, and foods cleared.'); return; }

  // create() runs password hashing middleware, unlike insertMany().
  const [admin] = await User.create(sampleUsers);
  const createdCategories = await Category.create(
    sampleCategories.map((category) => ({ ...category, createdBy: admin._id }))
  );

  const categoryMap = new Map(createdCategories.map((c) => [c.name, c._id]));

  const foodsToCreate = sampleFoods.map((f) => {
    const categoryId = categoryMap.get(f.categoryName) || createdCategories[0]._id;
    return {
      name: f.name,
      price: f.price,
      description: f.description,
      category: categoryId,
      image: f.image,
      isAvailable: f.isAvailable ?? true,
      createdBy: admin._id,
    };
  });

  await Food.create(foodsToCreate);

  console.log(`Seeded 3 accounts, ${createdCategories.length} categories, and ${foodsToCreate.length} food items.`);
  for (const user of sampleUsers) console.log(`${user.role}: ${user.email} / ${user.password}`);
}

try {
  await run();
} catch (err) {
  console.error('Seed failed:', err);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
