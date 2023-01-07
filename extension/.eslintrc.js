/* global module */
const config = require('../.eslintrc')

module.exports = {
  ...config,
  ignorePatterns: [
    ...config.ignorePatterns,
    'src/test/fixtures/**',
    'src/test/e2e/wdio.conf.ts',
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
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-misused-promises': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/unbound-method': 'off',
        // These aren't jest tests, but still use `expect`
        'jest/no-standalone-expect': 'off',
        'jest/valid-expect': 'off',
        'no-unused-expressions': 'off'
      }
    }
  ]
}
