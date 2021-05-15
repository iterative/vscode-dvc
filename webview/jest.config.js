/* global module */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  moduleNameMapper: {
    '\\.(scss|css|less)$': 'identity-obj-proxy'
  },
  globals: {
    __webpack_public_path__: true
  }
}
