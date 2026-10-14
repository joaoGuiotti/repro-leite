/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  moduleNameMapper: {
    '^expo-sqlite$': '<rootDir>/__mocks__/expo-sqlite.ts',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@ui/(.*)$': '<rootDir>/src/ui/$1',
    '^@ui$': '<rootDir>/src/ui',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
