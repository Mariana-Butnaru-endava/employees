import { defineConfig } from 'vite';
import { env } from './src/config/env.ts';

const devPort = Number(new URL(env.devBaseURL).port) || 5173;

export default defineConfig({
  root: 'client',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: devPort,
    proxy: {
      '/api': env.baseURL,
      '/health': env.baseURL,
    },
  },
});
