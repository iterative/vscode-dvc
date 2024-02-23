/* global module */
const config = require('../.eslintrc')

module.exports = {
  ...config,
  ignorePatterns: [
    ...config.ignorePatterns,
    'src/test/fixtures/**',
    'src/test/e2e/**',
    '**/__mocks__/**'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json']
  },
  overrides: [
    ...config.overrides,
    {
      files: ['src/test/**/*'],
      rules: {
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/unbound-method': 'off'
      }
    },
    {
      files: ['src/test/**/*.test.ts'],
      rules: {
        // These aren't jest tests, but still use `expect`
        'jest/no-standalone-expect': 'off',
        'jest/valid-expect': 'off',
        'no-unused-expressions': 'off'
      }
    },
    {
      files: ['src/test/e2e/**/*'],
      rules: { '@typescript-eslint/no-unsafe-declaration-merging': 'off' }
    }
  ]
}
