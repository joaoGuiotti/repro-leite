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
    '^expo-haptics$': '<rootDir>/__mocks__/expo-haptics.ts',
    '^@shopify/flash-list$': '<rootDir>/__mocks__/@shopify/flash-list.js',
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
    '^@react-native-community/netinfo$': '<rootDir>/node_modules/@react-native-community/netinfo/jest/netinfo-mock.js',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@ui/(.*)$': '<rootDir>/src/ui/$1',
    '^@ui$': '<rootDir>/src/ui',
    '^@i18n/(.*)$': '<rootDir>/src/i18n/$1',
    '^@i18n$': '<rootDir>/src/i18n',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
