/* global module */
const config = require('../.eslintrc')

module.exports = {
  ...config,
  ignorePatterns: [...config.ignorePatterns, 'storybook-static/**'],
  overrides: [
    ...config.overrides,
    {
      files: ['src/**'],
      rules: {
        'check-file/no-index': 'error'
      }
    },
    {
      files: [
        'src/experiments/index.tsx',
        'src/plots/index.tsx',
        'src/shared/components/icons/index.ts'
      ],
      rules: {
        'check-file/no-index': 'off'
      }
    },
    {
      files: ['src/**'],
      rules: {
        'check-file/folder-naming-convention': [
          'error',
          {
            'src/**/': 'CAMEL_CASE',
            'src/shared/components/**': 'CAMEL_CASE'
          }
        ]
      }
    },
    {
      files: ['src/shared/**'],
      rules: {
        'check-file/folder-naming-convention': 'off'
      }
    }
  ]
}
