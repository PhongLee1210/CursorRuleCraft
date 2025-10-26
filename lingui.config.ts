import type { LinguiConfig } from '@lingui/conf';

const config: LinguiConfig = {
  format: 'po',
  sourceLocale: 'en-US',
  fallbackLocales: { default: 'en-US' },
  locales: ['en-US', 'vi-VN'],
  catalogs: [
    {
      include: ['<rootDir>/apps/frontend/src'],
      path: '<rootDir>/apps/frontend/src/locales/{locale}/messages',
    },
  ],
};

export default config;
