/* global module */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['<rootDir>/src/test/', '<rootDir>/dist/'],
  coverageDirectory: 'coverage/unit'
}
