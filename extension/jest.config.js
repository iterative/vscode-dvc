/* global module */

module.exports = {
  coverageDirectory: 'coverage/unit',
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['<rootDir>/src/test/', '<rootDir>/dist/']
}
