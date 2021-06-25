import { resolve } from 'path'
import * as webpack from 'webpack'
import { CleanWebpackPlugin } from 'clean-webpack-plugin'

const r = (file: string) => resolve(__dirname, file)

module.exports = {
  devtool: 'source-map',
  entry: r('./src/extension'),
  externals: {
    'dvc-vscode-webview': r('../webview/'),
    fsevents: "require('fsevents')",
    vscode: 'commonjs vscode'
  },
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  node: {
    __dirname: false
  },
  output: {
    devtoolModuleFilenameTemplate: '../[resource-path]',
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    path: r('./dist')
  },
  plugins: [new CleanWebpackPlugin()],
  resolve: {
    extensions: ['.ts', '.js']
  },
  target: 'node'
} as webpack.Configuration
