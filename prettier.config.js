/** @type {import('prettier').Config} */
export default {
  // Basic formatting options aligned with .editorconfig
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: false,
  quoteProps: 'as-needed',
  trailingComma: 'es5',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',

  // Import sorting and organization
  plugins: ['@ianvs/prettier-plugin-sort-imports'],

  // Import sorting configuration
  importOrder: [
    '^react$',
    '^react-dom$',
    '^react-native$',
    '',
    '^@?\\w',
    '',
    '^@frontend/(.*)$',
    '',
    '^\\.\\./(.*)$',
    '^\\./(.*)$',
    '',
    '\\.css$',
    '\\.scss$',
    '\\.module\\.css$',
    '\\.module\\.scss$',
  ],
  importOrderBuiltinModulesToTop: true,
  importOrderCaseSensitive: false,
  importOrderMergeDuplicateImports: true,
  importOrderCombineTypeAndValueImports: true,
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
  importOrderSeparator: '\n',

  // File type specific overrides
  overrides: [
    {
      files: ['*.md', '*.mdx'],
      options: {
        printWidth: 'off',
        proseWrap: 'always',
      },
    },
    {
      files: ['*.json', '*.jsonc'],
      options: {
        trailingComma: 'none',
      },
    },
  ],

  // End of line and whitespace
  endOfLine: 'lf',

  // Ignore certain files
  ignore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/*.min.js',
    '**/*.min.css',
    '**/coverage/**',
    '**/*.generated.ts',
    '**/*.generated.js',
    '.nx/**',
  ],
};
