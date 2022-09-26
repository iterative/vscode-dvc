/* eslint-disable import/default */
import { resolve } from 'path'
import { CleanWebpackPlugin } from 'clean-webpack-plugin'
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin'

const r = (file: string) => resolve(__dirname, file)

export default {
  devtool: 'source-map',
  entry: r('./src/server'),
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true
            }
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
    filename: 'server.js',
    libraryTarget: 'commonjs2',
    path: r('./dist')
  },
  plugins: [new CleanWebpackPlugin(), new ForkTsCheckerWebpackPlugin()],
  resolve: {
    extensions: ['.ts', '.js'],
    modules: ['node_modules'],
    symlinks: false
  },
  target: 'node'
}
