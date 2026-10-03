module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  clearMocks: true,
  collectCoverageFrom: [
    'src/domain/**/*.ts',
    'src/application/**/*.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html'],
};