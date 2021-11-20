/* global module */

module.exports = {
  globals: {
    __webpack_public_path__: true
  },
  moduleNameMapper: {
    '\\.(scss|css|less|svg)$': 'identity-obj-proxy'
  },
  preset: 'ts-jest',
  setupFiles: ['jest-canvas-mock'],
  testEnvironment: 'node',
  testTimeout: 10000
}
