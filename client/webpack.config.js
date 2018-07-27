const path = require("path");

module.exports = {
  watch: false,
  watchOptions: {
    poll: 500,
    aggregateTimeout: 300
  },
  mode: 'development',
  entry: './src/App.ts',
  module: {
    rules: [{
      test: /\.tsx?$/,
      use: 'ts-loader',
      exclude: /node_modules/
    }]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  output: {
    filename: './index.js',
    path: path.resolve(__dirname, 'js')
  }
};
