/* eslint-env node */
const path = require('path');

const resolvePath = (name) => path.resolve(__dirname, name);

const configureLib = (libName, libFile, libType) => () => ({
  name: libName,
  externals: {
    react: {
      module: 'react',
      commonjs2: 'react',
    },
    miew: {
      module: 'miew',
      commonjs2: 'miew',
    },
    three: {
      module: 'three',
      commonjs2: 'three',
    },
    lodash: {
      module: 'lodash',
      commonjs2: 'lodash',
    },
  },
  entry: {
    index: resolvePath('src/index.js'),
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: {
          loader: 'babel-loader',
          options: {
            rootMode: 'upward',
          },
        },
      },
      {
        test: /\.[sp]?css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                auto: true,
                namedExport: false,
              },
              importLoaders: 1,
            },
          },
          'postcss-loader',
        ],
      },
    ],
  },
  resolve: {
    extensions: ['*', '.js', '.jsx', '.scss'],
  },
  output: {
    path: resolvePath('dist'),
    filename: libFile,
    library: {
      type: libType,
    },
    environment: {
      module: true,
    },
  },
  experiments: {
    outputModule: libType === 'module',
  },
  devtool: 'source-map',
});

module.exports = [
  configureLib('miew-react', '[name].js', 'commonjs2'),
  configureLib('miew-react-module', '[name].modern.js', 'module'),
];
