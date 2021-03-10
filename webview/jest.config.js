/* global module */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  moduleNameMapper: {
    '\\.(scss|css|less)$': 'identity-obj-proxy',
    '^dvc/common$': '<rootDir>/../extension/src/common',
    '^dvc/experiments-contract$':
      '<rootDir>/../extension/src/webviews/experiments/contract'
  },
  globals: {
    __webpack_public_path__: true
  }
}
