import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['coverage/**', 'node_modules/**'] },
  js.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node, ...globals.jest } },
    rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }] },
  },
];
