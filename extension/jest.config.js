/* global module */

module.exports = {
  coverageDirectory: 'coverage/unit',
  coveragePathIgnorePatterns: ['<rootDir>/src/test/'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['<rootDir>/src/test/suite', '<rootDir>/dist/']
}
