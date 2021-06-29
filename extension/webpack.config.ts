import { join, resolve } from 'path'
import * as webpack from 'webpack'
import { CleanWebpackPlugin } from 'clean-webpack-plugin'
import { readFileSync } from 'fs-extra'
const CopyWebpackPlugin = require('copy-webpack-plugin')

const r = (file: string) => resolve(__dirname, file)
function includeDependency(location: string) {
  const content = readFileSync(join(location, 'package.json'), {
    encoding: 'utf8'
  })
  const pkgName = JSON.parse(content).name

  return new CopyWebpackPlugin({
    patterns: [
      {
        from: `${location}/dist`,
        to: r(`./dist/node_modules/${pkgName}/dist`)
      },
      {
        from: `${location}/index.js`,
        to: r(`./dist/node_modules/${pkgName}/index.js`)
      },
      {
        from: `${location}/package.json`,
        to: r(`./dist/node_modules/${pkgName}/package.json`)
      }
    ]
  })
}

module.exports = {
  devtool: 'source-map',
  entry: r('./src/extension'),
  externals: {
    'dvc-vscode-webview': 'dvc-vscode-webview',
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
  plugins: [new CleanWebpackPlugin(), includeDependency(r('../webview/'))],
  resolve: {
    extensions: ['.ts', '.js'],
    modules: ['node_modules'],
    symlinks: false
  },
  target: 'node'
} as webpack.Configuration
