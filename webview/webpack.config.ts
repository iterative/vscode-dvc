import * as webpack from 'webpack'
import { CleanWebpackPlugin } from 'clean-webpack-plugin'
import path = require('path')
import HtmlWebpackPlugin = require('html-webpack-plugin')
import ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')

const r = (file: string) => path.resolve(__dirname, file)

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
        loaders: ['style-loader', 'css-loader', 'less-loader']
      },
      { test: /\.css$/, loader: 'style-loader!css-loader' },
      { test: /\.scss$/, loader: 'style-loader!css-loader!sass-loader' },
      {
        test: /\.(jpe?g|png|gif|eot|ttf|svg|woff|woff2|md)$/i,
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
    const plugins: any[] = [
      new HtmlWebpackPlugin({
        title: 'DVC View'
      }),
      new ForkTsCheckerWebpackPlugin(),
      new CleanWebpackPlugin()
    ]

    return plugins
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
