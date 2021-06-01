import { WebviewType } from 'dvc/src/experiments/webview/contract'
import webpack from 'webpack'
import { CleanWebpackPlugin } from 'clean-webpack-plugin'
import { resolve } from 'path'
import HtmlWebpackPlugin = require('html-webpack-plugin')
import ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')

const r = (file: string) => resolve(__dirname, file)

const styleLoader = 'style-loader'
const cssLoader = 'css-loader'

module.exports = {
  devServer: {
    disableHostCheck: true,
    headers: {
      'Access-Control-Allow-Headers':
        'X-Requested-With, content-type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Origin': '*'
    }
  },
  devtool: 'source-map',
  entry: [r('src/index.tsx')],
  module: {
    rules: [
      {
        loaders: [styleLoader, cssLoader, 'less-loader'],
        test: /\.less$/
      },
      {
        loaders: [
          styleLoader,
          {
            loader: cssLoader,
            options: {
              modules: { auto: true }
            }
          }
        ],
        test: /\.css$/
      },
      {
        loaders: [
          styleLoader,
          {
            loader: cssLoader,
            options: {
              modules: { auto: true }
            }
          },
          'sass-loader'
        ],
        test: /\.scss$/
      },
      {
        loader: 'file-loader',
        test: /\.(jpe?g|png|gif|eot|svg|woff|woff2|md)$/i
      },
      {
        loader: 'ts-loader',
        options: { transpileOnly: true },
        test: /\.tsx?$/
      }
    ]
  },
  node: {
    fs: 'empty'
  },
  output: {
    chunkFilename: '[name]-[hash].js',
    devtoolModuleFilenameTemplate: info => {
      let result = info.absoluteResourcePath.replace(/\\/g, '/')
      if (!result.startsWith('file:')) {
        // Some paths already start with the file scheme.
        result = `file:///${result}`
      }
      return result
    },
    filename: '[name].js',
    path: r('dist')
  },
  plugins: (() => {
    return [
      new HtmlWebpackPlugin({
        title: WebviewType
      }),
      new ForkTsCheckerWebpackPlugin(),
      new CleanWebpackPlugin()
    ]
  })(),
  resolve: {
    extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js']
  }
} as webpack.Configuration
