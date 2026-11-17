import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  base: './',
  root: '.',
  publicDir: 'public',
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@catalog/core-image': resolve(__dirname, '../core-image/src/index.ts'),
      '@catalog/storage-github': resolve(__dirname, '../storage-github/src/index.ts'),
      '@catalog/storage-gdrive': resolve(__dirname, '../storage-gdrive/src/index.ts'),
    },
  },
});
