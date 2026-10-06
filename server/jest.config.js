export default {
  testEnvironment: 'node',
  transform: {},
  setupFiles: ['<rootDir>/tests/env.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  testTimeout: 120000,
  maxWorkers: 1,
  collectCoverageFrom: ['src/**/*.js', '!src/server.js', '!src/seed/seed.js'],
  coverageProvider: 'v8',
};
