const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    app: './src/index.js',
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    chunkFilename: '[name].bundle.js',
    filename: 'index.js',
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        use: ['babel-loader'],
      },
      {
        test: /\.[s]?css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
            },
          },
          'postcss-loader',
        ],
      }],
  },
  performance: {
    hints: false,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      title: 'Miew – 3D Molecular Viewer',
    }),
  ],
  optimization: {
    runtimeChunk: {
      name: 'manifest',
    },
    splitChunks: {
      name: false,
      chunks: 'all',
      cacheGroups: {
        miew: {
          name: 'miew',
          test: /[\\/]node_modules[\\/]miew[\\/]/,
        },
        vendor: {
          name: 'vendor',
          test: /[\\/]node_modules[\\/](?!miew[\\/])/,
        },
      },
    },
  },
  devtool: 'source-map',
  stats: {
    assets: false,
    colors: true,
    chunks: true,
  },
  watchOptions: {
    ignored: /node_modules/,
  },
};
