/* global module */

module.exports = {
  coverageDirectory: 'coverage/jest',
  coveragePathIgnorePatterns: ['<rootDir>/src/test/'],
  coverageReporters: ['json'],
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    '<rootDir>/src/test/',
    '<rootDir>/dist/',
    '<rootDir>/.vscode-test',
    '<rootDir>/.wdio-vscode-service'
  ],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest']
  }
}
