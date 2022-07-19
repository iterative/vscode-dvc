/* global module */

module.exports = {
  coverageDirectory: 'coverage/jest',
  coveragePathIgnorePatterns: ['<rootDir>/src/test/'],
  coverageReporters: ['json'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    '<rootDir>/src/test/',
    '<rootDir>/dist/',
    '<rootDir>/.vscode-test',
    '<rootDir>/.wdio-vscode-service'
  ]
}
