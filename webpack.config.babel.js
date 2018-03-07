/* eslint-env node */

import path from 'path';
import webpack from 'webpack';
import yargs from 'yargs';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import StringReplaceWebpackPlugin from 'string-replace-webpack-plugin';
import version from './tools/version';
import config from './tools/config';

const roServerReplacer = {
  loader: StringReplaceWebpackPlugin.replace({
    replacements: [{
      pattern: /<!-- block:READONLY_SERVER-(\d) -->([\s\S]*)<!-- endblock:READONLY_SERVER-\1 -->/g,
      replacement: () => '',
    }]
  })
};

export default {
  entry: {
    demo: './demo/scripts/index.js',
  },
  output: {
    publicPath: './',
    path: path.resolve(__dirname, 'build'),
    filename: '[name].[chunkhash].js',
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /(node_modules|vendor)/,
      use: ['babel-loader'],
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
  plugins: [
    new webpack.DefinePlugin({
      PACKAGE_VERSION: JSON.stringify(version.combined),
      READONLY_SERVER: config.roServer,
      PRESET_SERVER: JSON.stringify(yargs.argv.service),
      COOKIE_PATH: JSON.stringify(yargs.argv.cookiePath),
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
    new CopyWebpackPlugin([
      {from: 'demo/data', to: 'data'},
      {from: 'demo/images', to: 'images'},
    ]),
    new StringReplaceWebpackPlugin(),
    new webpack.HashedModuleIdsPlugin(),
  ],
  optimization: {
    runtimeChunk: {
      name: 'manifest'
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
};
