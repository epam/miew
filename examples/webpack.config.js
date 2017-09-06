module.exports = {
  entry: './miew_via_webpack.js',
  output: {
    filename: 'miew_via_webpack.bundle.js'
  },
  module: {
    rules: [{
      test: /\.css$/,
      use: ['style-loader', 'css-loader'],
    }],
  },
};
