import { mergeConfig, defineConfig } from 'vitest/config';

import viteConfig from './vite.config.ts';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      clearMocks: true,
      css: true,
      environment: 'jsdom',
      globals: true,
      include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
      restoreMocks: true,
      setupFiles: ['./tests/setup.ts'],
    },
  }),
);
