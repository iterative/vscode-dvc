const config = require('../.eslintrc')

module.exports = {
  ...config,
  ignorePatterns: [...config.ignorePatterns, 'src/test/fixtures/**']
}
