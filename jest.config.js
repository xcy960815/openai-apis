module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  testPathIgnorePatterns: ['/node_modules/', '/temp/', '/dist/'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
};
