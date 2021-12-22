const path = require('path')
module.exports = {
  entry: './miew_via_react.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    chunkFilename: '[name].bundle.js',
    filename: 'miew_via_react.bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        use: ['babel-loader']
      },
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
