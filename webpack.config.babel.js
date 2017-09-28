import webpack from 'webpack';
import webpackMerge from 'webpack-merge';

import webpackCommon from './webpack.common.js';

export default webpackMerge(webpackCommon, {
  devtool: 'source-map',
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
    }),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production'),
      },
    }),
  ],
});
