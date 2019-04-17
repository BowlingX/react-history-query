const path = require('path')
const FlowStatusWebpackPlugin = require('flow-status-webpack-plugin')

module.exports = {
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      }
    ]
  },
  plugins: [
    new FlowStatusWebpackPlugin({
      binaryPath: 'node_modules/.bin/flow',
      onSuccess: console.log,
      onError: console.error
    })
  ],
  externals: {
    'cheerio': 'window',
    'react/addons': true,
    'react/lib/ExecutionEnvironment': true,
    'react/lib/ReactContext': true
  }
}
