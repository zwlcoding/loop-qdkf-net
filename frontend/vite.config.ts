import { defineConfig } from 'vite';

const pagesBase = '/loop-qdkf-net/';

export default defineConfig(({ command }) => ({
  root: '.',
  base: command === 'serve' ? '/' : pagesBase,
  publicDir: 'assets',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 5173,
    host: true,
  },
}));
