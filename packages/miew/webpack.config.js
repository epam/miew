/* eslint-env node */

const path = require('path');
const webpack = require('webpack');
const yargs = require('yargs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const version = require('./tools/version');

const ignoreWarnings = [
  /size limit/,
  /performance recommendations/,
];

const resolvePath = (name) => path.resolve(__dirname, name);

const configureDemo = (prod) => ({
  name: 'demo',
  entry: {
    demo: resolvePath('demo/scripts/index.js'),
  },
  output: {
    publicPath: '',
    path: resolvePath('build'),
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
          rootMode: 'upward',
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
      type: 'asset/source',
    }, {
      test: /\.(woff|woff2|eot|ttf|svg)$/,
      type: 'asset/inline',
    }],
  },
  resolve: {
    alias: {
      Miew: resolvePath('src/index.js'),
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
      template: resolvePath('demo/index.ejs'),
      title: 'Miew – 3D Molecular Viewer',
      favicon: resolvePath('demo/favicon.ico'),
      scriptLoading: 'defer',
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[name].[contenthash].css',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: resolvePath('demo/data'), to: 'data' },
        { from: resolvePath('demo/images'), to: 'images' },
      ],
    }),
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
      directory: resolvePath('build'),
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
  ignoreWarnings,
});

const configureLib = (prod, libName, libFile, libType, minimize = false) => ({
  name: libName,
  externals: {
    three: {
      module: 'three',
      commonjs: 'three',
      commonjs2: 'three',
      amd: 'three',
      root: 'THREE',
    },
    lodash: {
      module: 'lodash',
      commonjs: 'lodash',
      commonjs2: 'lodash',
      amd: 'lodash',
      root: '_',
    },
  },
  entry: {
    Miew: resolvePath('src/index.js'),
  },
  plugins: [
    new webpack.BannerPlugin(`${version.copyright}`),
    new webpack.DefinePlugin({
      PACKAGE_VERSION: JSON.stringify(version.combined),
      DEBUG: !prod,
    }),
  ],
  module: {
    rules: [{
      test: /\.(vert|frag)$/,
      type: 'asset/source',
    }, {
      test: /\.js$/,
      use: {
        loader: 'babel-loader',
        options: {
          rootMode: 'upward',
        },
      },
    },
    ],
  },
  output: {
    path: resolvePath('build'),
    filename: libFile,
    library: {
      ...(libType !== 'module') && { name: 'Miew', export: 'default' },
      type: libType,
      umdNamedDefine: false,
    },
    globalObject: 'this',
    environment: {
      module: true,
    },
  },
  experiments: {
    outputModule: libType === 'module',
  },
  optimization: {
    minimize,
    minimizer: [
      new TerserWebpackPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
          },
          format: {
            comments: /copyright/i,
          },
        },
        extractComments: false,
      }),
    ],
  },
  devtool: 'source-map',
  ignoreWarnings,
});

module.exports = [
  (env, argv) => configureLib(argv.mode === 'production', 'miew', 'dist/[name].js', 'umd'),
  (env, argv) => configureLib(argv.mode === 'production', 'miew-min', 'dist/[name].min.js', 'umd', true),
  (env, argv) => configureLib(argv.mode === 'production', 'miew-module', 'dist/[name].module.js', 'module'),
  (env, argv) => configureDemo(argv.mode === 'production'),
];
