const config = require('../.eslintrc')

module.exports = {
  ...config,
  ignorePatterns: [...config.ignorePatterns, 'src/test/fixtures/**'],
  overrides: [
    ...config.overrides,
    {
      files: ['src/test/**/*.test.ts']
    }
  ]
}
