/* global module */

module.exports = {
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!**/*.test.*',
    '!src/stories/*',
    '!src/test/*',
    '!src/shared/components/icons/*',
    '!src/util/wdyr.ts'
  ],
  coverageDirectory: 'coverage/jest',
  coverageReporters: ['json'],
  globals: {
    __webpack_public_path__: true
  },
  moduleNameMapper: {
    '\\.(scss|css|less)$': 'identity-obj-proxy'
  },
  preset: 'ts-jest',
  setupFiles: ['jest-canvas-mock', '<rootDir>/setup-tests.js'],
  testEnvironment: 'node',
  testTimeout: 10000
}
