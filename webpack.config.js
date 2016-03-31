var webpack = require('webpack');

module.exports = {
  entry: './src/module.ts',
  output: {
    filename: 'dist.js'
  },

  // Turn on sourcemaps
  devtool: 'source-map',
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.js']
  },

  module: {
    loaders: [
      { test: /\.ts$/, loader: 'ts' }
    ]
  }
};