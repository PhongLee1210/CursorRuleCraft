import { LinguiConfig } from '@lingui/conf';

const config = {
  format: 'po',
  sourceLocale: 'en-US',
  fallbackLocales: { default: 'en-US' },
  locales: ['en-US'],
  rootDir: '.',
  catalogs: [
    {
      include: ['src'],
      path: 'src/locales/{locale}/messages',
      exclude: ['**/node_modules/**'],
    },
  ],
};

export default config;
