/* eslint-env node */

import path from 'path';
import webpack from 'webpack';
import yargs from 'yargs';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ScriptExtHtmlWebpackPlugin from 'script-ext-html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import version from './tools/version';

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
          limit: 8192,
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
    new webpack.IgnorePlugin(/vertx/), // https://github.com/webpack/webpack/issues/353
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
    new webpack.HashedModuleIdsPlugin(),
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
    // hot: true,
    contentBase: './build',
    publicPath: '/',
    compress: true,
    clientLogLevel: 'info',
    overlay: true,
    stats: {
      assets: false,
      colors: true,
      cached: false,
      cachedAssets: false,
    },
  },
});

export default (env, argv) => configure(argv.mode === 'production');
