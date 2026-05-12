module.exports = {
  collectCoverageFrom: ['app.js', 'lib/**/*.js', '!lib/**/__mocks__/**'],
  coverageThreshold: {
    global: {
      statements: 75,
      branches: 65,
      functions: 70,
      lines: 75,
    },
  },
  testEnvironment: 'node',
};
