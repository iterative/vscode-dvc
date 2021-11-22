import { Configuration, RuleSetRule } from 'webpack'

export default {
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
  },
  webpackFinal: (config: Configuration) => {
    const rules = config?.module?.rules as RuleSetRule[]
    if (rules) {
      const existingSvgRuleIndex = rules.findIndex(
        rule => rule.test instanceof RegExp && rule.test.test('.svg')
      )
      if (existingSvgRuleIndex >= 0) {
        const existingSvgRule = rules[existingSvgRuleIndex]
        const { test, ...rest } = existingSvgRule
        const newSvgRule = {
          test,
          oneOf: [
            {
              test: /\.svg$/,
              resourceQuery: /svgr/,
              use: '@svgr/webpack'
            },
            {
              test: /\.svg$/,
              type: 'asset/inline'
            },
            rest
          ]
        }
        rules.splice(existingSvgRuleIndex, 1, newSvgRule)
        return config
      }
    }
  }
}
