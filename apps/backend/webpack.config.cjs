const { composePlugins, withNx } = require('@nx/webpack');
const path = require('path');
const fs = require('fs');

// Nx plugins for webpack.
module.exports = composePlugins(withNx(), (config) => {
  // Add path mappings for Nx workspace
  config.resolve.alias = {
    ...config.resolve.alias,
    '@cursorrulecraft/shared-types': path.resolve(
      __dirname,
      '../../libs/shared-types/src/index.ts'
    ),
    '@backend': path.resolve(__dirname, './src'),
  };

  // Don't externalize workspace libraries
  if (config.externals) {
    const originalExternals = config.externals;
    config.externals = (context, request, callback) => {
      // Don't externalize our workspace libraries
      if (request && request.includes('@cursorrulecraft')) {
        return callback();
      }
      // Use original externals logic for everything else
      if (Array.isArray(originalExternals)) {
        for (const ext of originalExternals) {
          if (typeof ext === 'function') {
            ext(context, request, callback);
            return;
          }
        }
      } else if (typeof originalExternals === 'function') {
        return originalExternals(context, request, callback);
      }
      return callback();
    };
  }

  return config;
});
