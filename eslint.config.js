import babelParser from '@babel/eslint-parser';
import eslint from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      '.astro/**',
      '**/*.d.ts',
    ],
  },
  eslint.configs.recommended,
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parser: babelParser,
      parserOptions: {
        babelOptions: {
          plugins: [
            '@babel/plugin-syntax-jsx',
            ['@babel/plugin-syntax-typescript', { isTSX: true }],
          ],
        },
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        requireConfigFile: false,
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs['recommended-latest'].rules,
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Babel parses TypeScript syntax but does not expose type-only bindings
      // to ESLint's core scope analyser. Type correctness remains enforced by
      // `npm run typecheck`; React and hooks rules still run on every TSX file.
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: ['**/*.{test,spec}.{ts,tsx}'],
    rules: {
      'no-console': 'off',
    },
  },
];
