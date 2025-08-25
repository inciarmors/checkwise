module.exports = {
  preset: 'ts-jest', // Use ts-jest for TypeScript support
  testEnvironment: 'node', // Simulate Node.js environment (as Checkwise runs)
  roots: ['<rootDir>/__tests__'], // Where to look for tests
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['**/*.test.ts'], // Test file pattern
  collectCoverage: true, // Enable coverage collection
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};