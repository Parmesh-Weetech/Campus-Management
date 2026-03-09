import type { Config } from 'jest';

const config: Config = {
    roots: ['<rootDir>/test'],          // look inside the test folder
    testRegex: '.*\\.spec\\.ts$',       // pick up .spec.ts files
    moduleFileExtensions: ['ts', 'js', 'json'],
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',       // compile TS with ts-jest
    },
    testEnvironment: 'node',
    testPathIgnorePatterns: ['/node_modules/'],
    moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1', // if you import src in your tests
    },
};

export default config;