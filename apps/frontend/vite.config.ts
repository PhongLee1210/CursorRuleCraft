import { defineConfig, loadEnv } from 'vite';

import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import react from '@vitejs/plugin-react';
import fs from 'fs';
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
      nxViteTsPaths(),
      react({
        babel: {
          plugins: ['@lingui/babel-plugin-lingui-macro'],
        },
      }),
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
      proxy: (() => {
        try {
          const proxyConfigPath = path.resolve(__dirname, 'proxy.conf.json');
          const proxyConfig = JSON.parse(fs.readFileSync(proxyConfigPath, 'utf8'));

          // Override target with environment variable if available
          if (proxyConfig['/api'] && process.env.VITE_API_URL) {
            proxyConfig['/api'].target = process.env.VITE_API_URL;
          }

          // Ensure rewrite function is properly set
          if (proxyConfig['/api'] && !proxyConfig['/api'].rewrite) {
            proxyConfig['/api'].rewrite = (path: string) => path;
          }

          return proxyConfig;
        } catch (error) {
          console.warn('Could not load proxy.conf.json, using default configuration:', error);
          return {
            '/api': {
              target: process.env.VITE_API_URL || 'http://localhost:4000',
              changeOrigin: true,
              secure: false,
              rewrite: (path: string) => path,
            },
          };
        }
      })(),
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
