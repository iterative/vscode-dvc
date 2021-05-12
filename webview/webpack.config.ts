import { WebviewType } from 'dvc/src/Experiments/Webview/contract'
import webpack from 'webpack'
import { CleanWebpackPlugin } from 'clean-webpack-plugin'
import { resolve } from 'path'
import HtmlWebpackPlugin = require('html-webpack-plugin')
import ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')

const r = (file: string) => resolve(__dirname, file)

const styleLoader = 'style-loader'
const cssLoader = 'css-loader'

module.exports = {
  entry: [r('src/index.tsx')],
  output: {
    path: r('dist'),
    filename: '[name].js',
    chunkFilename: '[name]-[hash].js',
    devtoolModuleFilenameTemplate: info => {
      let result = info.absoluteResourcePath.replace(/\\/g, '/')
      if (!result.startsWith('file:')) {
        // Some paths already start with the file scheme.
        result = `file:///${result}`
      }
      return result
    }
  },
  resolve: {
    extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js']
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.less$/,
        loaders: [styleLoader, cssLoader, 'less-loader']
      },
      {
        test: /\.css$/,
        loaders: [
          styleLoader,
          {
            loader: cssLoader,
            options: {
              modules: { auto: true }
            }
          }
        ]
      },
      {
        test: /\.scss$/,
        loaders: [
          styleLoader,
          {
            loader: cssLoader,
            options: {
              modules: { auto: true }
            }
          },
          'sass-loader'
        ]
      },
      {
        test: /\.(jpe?g|png|gif|eot|svg|woff|woff2|md)$/i,
        loader: 'file-loader'
      },
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: { transpileOnly: true }
      }
    ]
  },
  node: {
    fs: 'empty'
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
  devServer: {
    disableHostCheck: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers':
        'X-Requested-With, content-type, Authorization'
    }
  }
} as webpack.Configuration
