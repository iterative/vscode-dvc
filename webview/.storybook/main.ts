const path = require('path')
const webpack = require('webpack')

module.exports = {
  webpackFinal: config => {
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /vsCodeApi.ts$/,
        path.resolve(__dirname, '../src/model/__mocks__/vsCodeApi.storybook.ts')
      )
    )
    return config
  },
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    {
      name: '@storybook/preset-scss',
      options: {
        cssLoaderOptions: {
          modules: {
            localIdentName: '[path][name]__[local]--[hash:base64:5]',
            auto: true
          }
        }
      }
    }
  ],
  core: {
    builder: 'webpack5'
  },
  typescript: {
    reactDocgen: false
  }
}
