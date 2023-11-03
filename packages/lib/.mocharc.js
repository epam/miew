module.exports = {
  require: './tools/babel-register-wrapper.js',
  reporter: 'dot',
  spec: ['src/**/*.test.js', 'test/**/*.test.js'],
};
