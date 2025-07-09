module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'index-db.js',
    'lib/**/*.js',
    '!node_modules/**',
    '!coverage/**'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  testTimeout: 30000,
  verbose: true,
  transform: {
    '^.+\.m?js$': 'babel-jest'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!@octokit/rest|@octokit/core)'
  ]
};