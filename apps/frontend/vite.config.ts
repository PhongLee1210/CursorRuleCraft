import { lingui } from '@lingui/vite-plugin';
import { defineConfig, loadEnv } from 'vite';

import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  process.env = {
    ...process.env,
    ...loadEnv(mode, process.cwd(), ''),
  };

  return {
    envDir: '../../',
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
      proxy: {
        '/api': {
          target: process.env.VITE_API_URL || 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
        },
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.po': 'text',
        },
      },
    },
  };
});
