// Override before importing application code; tests never use the Atlas URI.
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/isolated-tests';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-with-at-least-32-characters';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-with-at-least-32-characters';
process.env.CLIENT_URL = 'http://localhost:5173';
