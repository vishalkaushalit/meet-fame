import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  resolve: {
    alias: { '@shared': fileURLToPath(new URL('../shared', import.meta.url)) },
  },
  base: command === 'serve' ? '/' : '/admin/',
  server: {
    fs: { allow: [fileURLToPath(new URL('..', import.meta.url))] },
    port: 5174,
    host: true,
  },
}));
