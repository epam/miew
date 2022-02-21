module.exports = {
  testPathIgnorePatterns: ['dist', 'node_modules'],
  testEnvironment: 'jsdom',
  transform: {
    '\\.js?$': 'babel-jest',
    '\\.(ts|tsx)$': 'ts-jest',
    '\\.svg$': '<rootDir>/fileTransformer.js'
  },
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy',
    '^src(.*)$': '<rootDir>/src/$1',
    '^components(.*)$': '<rootDir>/src/components/$1',
    '^state(.*)$': '<rootDir>/src/state/$1'
  },
  snapshotSerializers: [
    '@emotion/jest/serializer'
  ]
}
