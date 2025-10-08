import type { LinguiConfig } from '@lingui/conf';

const config: LinguiConfig = {
  format: 'po',
  sourceLocale: 'en-US',
  fallbackLocales: { default: 'en-US' },
  locales: ['en-US'],
  catalogs: [
    {
      include: ['<rootDir>/src'],
      path: '<rootDir>/src/locales/{locale}/messages',
      exclude: ['**/node_modules/**'],
    },
  ],
};

export default config;
