import { join, resolve } from 'path'
import { CleanWebpackPlugin } from 'clean-webpack-plugin'
import { readFileSync } from 'fs-extra'
import CopyWebpackPlugin from 'copy-webpack-plugin'

const r = (file: string) => resolve(__dirname, file)

const includeDependency = (location: string) => {
  const content = readFileSync(join(location, 'package.json'), {
    encoding: 'utf8'
  })
  const pkgName = JSON.parse(content).name

  return new CopyWebpackPlugin({
    patterns: ['dist', 'index.js', 'package.json'].map(target => ({
      from: `${location}/${target}`,
      to: r(`./dist/node_modules/${pkgName}/${target}`)
    }))
  })
}

const includeFiles = () =>
  new CopyWebpackPlugin({
    patterns: ['README.md', 'LICENSE'].map(file => ({
      from: r(`../${file}`),
      to: r('.')
    }))
  })

export default {
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
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    path: r('./dist')
  },
  plugins: [
    new CleanWebpackPlugin(),
    includeDependency(r('../webview/')),
    includeFiles()
  ],
  resolve: {
    extensions: ['.ts', '.js'],
    modules: ['node_modules'],
    symlinks: false
  },
  target: 'node'
}
