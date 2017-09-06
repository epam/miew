/* eslint-env node */

import path from 'path';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import StringReplaceWebpackPlugin from 'string-replace-webpack-plugin';
import version from './tools/version';
import config from './tools/config';

const buildPath = 'build';

const roServerReplacer = {
  loader: StringReplaceWebpackPlugin.replace({
    replacements: [{
      pattern: /<!-- block:READONLY_SERVER-(\d) -->([\s\S]*)<!-- endblock:READONLY_SERVER-\1 -->/g,
      replacement: () => '',
    }]
  })
};

export default {
  devtool: 'inline-source-map',
  entry: {
    demo: './demo/scripts/main-webpack.js',
  },
  output: {
    publicPath: './',
    path: path.resolve(__dirname, buildPath),
    filename: '[name].bundle.js',
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /(node_modules|vendor)/,
      use: [{
        loader: 'babel-loader',
      }],
    }, {
      test: /\.css$/,
      use: ['style-loader', 'css-loader'],
    }, {
      test: /\.scss$/,
      use: ['style-loader', 'css-loader', 'sass-loader'],
    }, {
      test: /\.glsl$/,
      use: ['raw-loader'],
    }, {
      test: /menu.html$/,
      use: config.roServer ? ['raw-loader', roServerReplacer] : ['raw-loader'],
    }, {
      test: /\.html$/,
      exclude: /menu.html$/,
      use: ['raw-loader'],
    }, {
      test: /\.(woff|woff2|eot|ttf|svg)$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 8192
        }
      },
      ],
    }],
  },
  resolve: {
    alias: {
      Miew:    path.resolve(__dirname, 'src/index.js'),
      // lib
      three:   path.resolve(__dirname, 'vendor/js/three.module.js'),
      Smooth:  path.resolve(__dirname, 'vendor/js/Smooth.js'),
      mmtf:    path.resolve(__dirname, 'vendor/js/mmtf.js'),
    },
  },
  node: {
    fs: 'empty',
    path: 'empty',
  },
  plugins: [
    new webpack.DefinePlugin({
      PACKAGE_VERSION: JSON.stringify(version.combined),
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(),

    // https://github.com/webpack/webpack/issues/353
    new webpack.IgnorePlugin(/vertx/),
    new webpack.ProvidePlugin({
      jQuery: 'jquery',
      Promise: 'es6-promise',
    }),
    new HtmlWebpackPlugin({
      title: 'Miew – 3D Molecular Viewer',
      favicon: 'demo/favicon.ico',
    }),
    new CopyWebpackPlugin([
      {from: 'demo/data', to: 'data'},
      {from: 'demo/images', to: 'images'},
    ]),
    new StringReplaceWebpackPlugin(),
    // new webpack.optimize.UglifyJsPlugin({
    //   sourceMap: true,
    // }),
  ],
  devServer: {
    // hot: true,
    contentBase: [
      path.resolve(__dirname, buildPath),
      path.resolve(__dirname, './demo'),
      path.resolve(__dirname, './')
    ],
    publicPath: '/',
    compress: true,
    clientLogLevel: 'info',
    stats: {
      assets: false,
      colors: true,
      cached: false,
      cachedAssets: false,
    },
  },
  watchOptions: {
    ignored: /node_modules/,
  },
};
