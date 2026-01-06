module.exports = {
  require: [
    './tools/sinon-chai-import.js',
    './tools/babel-register-wrapper.js',
  ],
  reporter: 'dot',
  spec: ['src/**/*.test.js', 'test/**/*.test.js'],
};
