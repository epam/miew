module.exports = {
  entry: './miew_via_react.js',
  output: {
    path: __dirname,
    chunkFilename: '[name].bundle.js',
    filename: 'miew_via_react.bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      }],
  },
  performance: {
    hints: false,
  },
};
