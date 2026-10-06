import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB(uri = env.MONGO_URI) {
  mongoose.set('strictQuery', true);
  return mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
}
