import { ConfigEnv, defineConfig, loadEnv, searchForWorkspaceRoot, UserConfig } from 'vite';

import { lingui } from '@lingui/vite-plugin';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  process.env = {
    ...process.env,
    ...loadEnv(mode, process.cwd(), ''),
  };

  const isDev = mode === 'development';

  return {
    root: __dirname,
    cacheDir: '../../node_modules/.vite/frontend',
    build: {
      sourcemap: !isDev,
      emptyOutDir: !isDev,
      reportCompressedSize: isDev,
      outDir: '../../dist/apps/frontend',
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        external: (id) => {
          // Externalize Node.js modules that shouldn't be bundled for browser
          return id.includes('node:') || id.includes('__vite-browser-external');
        },
      },
    },
    plugins: [
      react({
        babel: {
          plugins: ['@lingui/babel-plugin-lingui-macro'],
        },
      }),
      lingui(),
      nxViteTsPaths(),
    ],
    resolve: {
      alias: {
        '@frontend': `${searchForWorkspaceRoot(process.cwd())}/apps/frontend/src/`,
      },
    },
    define: {
      appVersion: JSON.stringify(process.env.npm_package_version),
      global: 'globalThis',
    },
    server: {
      port: 3000,
      open: true,
      proxy: {
        '/api': {
          target: process.env.VITE_API_URL || 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
          rewrite: (path: string) => path,
        },
      },
      fs: { allow: [searchForWorkspaceRoot(process.cwd())] },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router'],
      esbuildOptions: {
        loader: {
          '.po': 'text',
        },
      },
    },
  };
});
