/* eslint-env node */

const path = require('path');
const webpack = require('webpack');
const yargs = require('yargs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const version = require('./tools/version');

const configure = (prod) => ({
  entry: {
    demo: './demo/scripts/index.js',
  },
  output: {
    publicPath: './',
    path: path.resolve(__dirname, 'build'),
    filename: '[name].[chunkhash].js',
    chunkFilename: '[name].[chunkhash].js',
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /(node_modules[\\/](?!three))|vendor/,
      use: {
        loader: 'babel-loader',
        options: {
          extends: path.join(__dirname, '/.babelrc'),
        },
      },
    }, {
      test: /\.[sp]?css$/,
      use: [
        prod ? MiniCssExtractPlugin.loader : 'style-loader',
        {
          loader: 'css-loader',
          options: {
            importLoaders: 1,
          },
        },
        'postcss-loader',
      ],
    }, {
      test: /\.(vert|frag|html)$/,
      use: ['raw-loader'],
    }, {
      test: /\.(woff|woff2|eot|ttf|svg)$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 131072,
        },
      },
      ],
    }],
  },
  resolve: {
    alias: {
      Miew: path.resolve(__dirname, 'src/index.js'),
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      PACKAGE_VERSION: JSON.stringify(version.combined),
      COOKIE_PATH: JSON.stringify(yargs.argv.cookiePath),
      DEBUG: !prod,
    }),
    new webpack.IgnorePlugin({ resourceRegExp: /vertx/ }), // https://github.com/webpack/webpack/issues/353
    new webpack.ProvidePlugin({
      jQuery: 'jquery',
    }),
    new HtmlWebpackPlugin({
      template: 'demo/index.ejs',
      title: 'Miew – 3D Molecular Viewer',
      favicon: 'demo/favicon.ico',
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[name].[contenthash].css',
    }),
    new ScriptExtHtmlWebpackPlugin({
      defaultAttribute: 'defer',
    }),
    new CopyWebpackPlugin([
      { from: 'demo/data', to: 'data' },
      { from: 'demo/images', to: 'images' },
    ]),
    new webpack.ids.HashedModuleIdsPlugin(),
  ],
  optimization: {
    runtimeChunk: {
      name: 'manifest',
    },
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          name: 'vendor',
          test: /[\\/](node_modules|vendor)[\\/]/,
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
  devServer: {
    static: {
      directory: './build',
      publicPath: '/',
      staticOptions: {
        compress: true,
      },
    },
    client: {
      logging: 'info',
      overlay: true,
    },
    devMiddleware: {
      // hot: true,
      stats: {
        assets: false,
        colors: true,
        cached: false,
        cachedAssets: false,
      },
    },
  },
});

module.exports = (env, argv) => configure(argv.mode === 'production');
