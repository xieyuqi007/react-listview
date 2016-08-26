'use strict';

import path from 'path';
import webpack from 'webpack';

export default {
  devtool: 'source-map',
  devServer: {
    noInfo: true
  },
  entry: [
    'webpack/hot/dev-server',
    './src/index.js'
  ],
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel-loader' },
      { test: /\.css$/, 
        loader: 'style-loader!css-loader',
        exclude: /Listview/
      },
      {
        test: /Listview\.css$/,
        loader:'style-loader!css-loader?modules&importLoaders=1&' + 
            'localIdentName=[name]__[local]___[hash:base64:5]'
      }
    ]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ]
};
