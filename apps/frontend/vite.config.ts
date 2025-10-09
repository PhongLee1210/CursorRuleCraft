import { lingui } from '@lingui/vite-plugin';

import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  cacheDir: '../../node_modules/.vite/frontend',
  build: {
    sourcemap: true,
    emptyOutDir: true,
    outDir: '../../dist/apps/frontend',
  },
  plugins: [
    react({
      babel: {
        plugins: ['@lingui/babel-plugin-lingui-macro'],
      },
    }),
    lingui(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@cursorrulecraft/shared-types': path.resolve(__dirname, '../../packages/shared-types/src'),
    },
  },
  define: {
    appVersion: JSON.stringify(process.env.npm_package_version),
  },
  server: {
    port: 3000,
    open: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.po': 'text',
      },
    },
  },
});
