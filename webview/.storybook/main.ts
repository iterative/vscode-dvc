import webpack from 'webpack'
import webpackConfig from '../webpack.config'

export default {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  staticDirs: ['../../extension/src/test/fixtures/plotsDiff/staticImages'],
  addons: [
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
  },
  webpackFinal: (config: webpack.Configuration) => {
    return {
      ...config,
      module: webpackConfig.module
    }
  }
}
