import webpack from 'webpack'
import webpackConfig from '../webpack.config'

export default {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  staticDirs: ['../../extension/src/test/fixtures/plotsDiff/staticImages'],
  addons: [
    'storybook-addon-themes',
    'storybook-addon-designs',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions'
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
      module: { ...config.module, rules: webpackConfig.module.rules }
    }
  }
}
