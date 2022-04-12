/* global module */
const config = require('../.eslintrc')

module.exports = {
  ...config,
  ignorePatterns: [...config.ignorePatterns, 'src/test/fixtures/**'],
  overrides: [
    ...config.overrides,
    {
      files: ['src/test/**/*.test.ts'],
      rules: {
        // These aren't jest tests, but still use `expect`
        'jest/valid-expect': 'off',
        'no-unused-expressions': 'off'
      }
    }
  ]
}
