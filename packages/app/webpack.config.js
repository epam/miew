const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const prod = process.env.NODE_ENV === 'production'

module.exports = {
  entry: {
    app: './src/index.js'
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].[chunkhash].js',
    chunkFilename: '[name].[chunkhash].js'
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        use: ['babel-loader']
      },
      {
        test: /\.(jsx)$/,
        use: ['babel-loader']
      },
      {
        test: /\.[sp]?css$/,
        use: [
          prod ? MiniCssExtractPlugin.loader : 'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1
            }
          },
          'postcss-loader'
        ]
      }
    ]
  },
  performance: {
    hints: false
  },
  resolve: {
    alias: {
      MiewModule: prod
        ? path.resolve(__dirname, 'node_modules/miew/dist/Miew.module.js')
        : path.resolve(__dirname, '../lib/dist/miew.module.js'),
      MiewStyles: prod
        ? path.resolve(__dirname, 'node_modules/miew/dist/Miew.css')
        : path.resolve(__dirname, '../lib/dist/miew.min.css')
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      title: 'Miew – 3D Molecular Viewer'
    }),
    new webpack.HashedModuleIdsPlugin(),
    new MiniCssExtractPlugin()
  ],
  optimization: {
    runtimeChunk: {
      name: 'manifest'
    },
    splitChunks: {
      name: false,
      chunks: 'all',
      cacheGroups: {
        miew: {
          name: 'miew',
          test: /[\\/]node_modules[\\/]miew[\\/]/
        },
        vendor: {
          name: 'vendor',
          test: /[\\/]node_modules[\\/](?!miew[\\/])/
        }
      }
    }
  },
  devtool: 'source-map',
  stats: {
    assets: false,
    colors: true,
    chunks: true
  },
  watchOptions: {
    ignored: /node_modules/
  }
}
