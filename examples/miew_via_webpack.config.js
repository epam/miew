const path = require('path')
module.exports = {
  entry: './miew_via_webpack.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    chunkFilename: '[name].bundle.js',
    filename: 'miew_via_webpack.bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  performance: {
    hints: false
  }
}
