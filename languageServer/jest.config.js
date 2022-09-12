module.exports = {
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!**/*.test.*', '!src/test/*'],
  coverageDirectory: 'coverage/jest',
  coveragePathIgnorePatterns: ['<rootDir>/src/test/'],
  coverageReporters: ['json'],
  testEnvironment: 'node',
  testPathIgnorePatterns: ['<rootDir>/dist/'],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest']
  }
}
