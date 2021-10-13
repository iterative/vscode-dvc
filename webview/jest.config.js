/* global module */

module.exports = {
  globals: {
    __webpack_public_path__: true
  },
  moduleNameMapper: {
    '\\.(scss|css|less)$': 'identity-obj-proxy'
  },
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 10000
}
