import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

import { siteConfigPlugin } from './src/config/sitePlugin.ts';
import { statusDevApiPlugin } from './server/status/devPlugin.ts';
import { statusHtmlFallbackPlugin } from './server/status/htmlFallbackPlugin.ts';

export default defineConfig({
  plugins: [statusHtmlFallbackPlugin(), siteConfigPlugin(), statusDevApiPlugin(), react()],
  server: {
    port: 4321,
    strictPort: true,
  },
  preview: {
    port: 4321,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rolldownOptions: {
      input: {
        navigation: resolve(import.meta.dirname, 'index.html'),
        status: resolve(import.meta.dirname, 'status.html'),
      },
    },
  },
});
