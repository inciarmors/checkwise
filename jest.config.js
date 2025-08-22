module.exports = {
  preset: 'ts-jest', // Usa ts-jest per supporto TypeScript
  testEnvironment: 'node', // Simula ambiente Node.js (come gira Checkwise)
  roots: ['<rootDir>/__tests__'], // Dove cercare i test
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['**/*.test.ts'], // Pattern dei file di test
  collectCoverage: true, // Attiva la raccolta della copertura
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};