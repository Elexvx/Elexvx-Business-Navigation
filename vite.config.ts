import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import { siteConfigPlugin } from './src/config/sitePlugin.ts';

export default defineConfig({
  plugins: [siteConfigPlugin(), react()],
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
  },
});
