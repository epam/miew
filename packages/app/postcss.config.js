/* eslint-disable global-require */
module.exports = {
  parser: 'postcss-scss',
  plugins: [
    require('postcss-advanced-variables')(),
    require('postcss-nested')(),
  ],
};
