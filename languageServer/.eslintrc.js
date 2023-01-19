const config = require('../.eslintrc')

module.exports = {
  ...config,
  parser: '@typescript-eslint/parser',
  ignorePatterns: [...config.ignorePatterns, 'src/test/fixtures/**'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json']
  }
}
