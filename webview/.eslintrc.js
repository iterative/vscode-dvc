/* global module */
const config = require('../.eslintrc')

module.exports = {
  ...config,
  ignorePatterns: [...config.ignorePatterns, 'storybook-static/**'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
    ecmaFeatures: {
      jsx: true
    }
  },
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
        'src/shared/components/icons/index.ts',
        'src/setup/index.tsx'
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
    },
    {
      files: ['**/*.tsx'],
      rules: {
        // breaks use of styles
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off'
      }
    }
  ]
}
