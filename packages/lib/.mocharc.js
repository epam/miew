module.exports = {
  require: '@babel/register',
  reporter: 'dot',
  spec: ['src/**/*.test.js', 'test/**/*.test.js'],
};
