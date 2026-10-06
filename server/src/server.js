import mongoose from 'mongoose';
import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

try {
  await connectDB();
  const server = app.listen(env.PORT, () => console.log(`API listening on port ${env.PORT}`));
  const shutdown = () => {
    const timeout = setTimeout(() => process.exit(1), 10000).unref();
    server.close(async () => {
      await mongoose.disconnect();
      clearTimeout(timeout);
      process.exit(0);
    });
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
  server.on('error', () => { console.error('HTTP server failed to start'); process.exit(1); });
} catch {
  console.error('Database connection failed. Check MONGO_URI and database network access.');
  process.exit(1);
}
