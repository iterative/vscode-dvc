import webpack from 'webpack'

module.exports = {
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
