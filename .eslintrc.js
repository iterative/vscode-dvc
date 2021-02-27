/* global module */

module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    project: './tsconfig.json'
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier',
    'prettier/@typescript-eslint'
  ],
  settings: {
    react: {
      version: 'detect'
    }
  },
  plugins: ['import', 'react', 'prettier', '@typescript-eslint'],
  env: {
    browser: false,
    es6: true
  },
  rules: {
    /* Allowing for any eases development in the early stages, but there's a
      case for eventually turning it off when APIs are more stable. */
    '@typescript-eslint/no-explicit-any': 'off',
    /* Many DVC JSON exports use non-camelcase keys, and it's not worth
       converting them all */
    camelcase: 'off',
    // TS no-unused-vars requires the default rule be disabled
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error'],
    // Treat prettier issues as errors
    'prettier/prettier': ['error'],
    // We use TS in place of the recommended prop-types
    'react/prop-types': 'off',
    '@typescript-eslint/unbound-method': 'off'
  },
  overrides: [
    // Jest tests rely on a lot of undefined globals
    {
      files: ['**/*.test.*'],
      rules: {
        'no-undef': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-floating-promises': 'off'
      }
    },
    // Webpack dependencies are meant to be devDependencies
    {
      files: ['**/*/webpack.config.[tj]s'],
      rules: {
        'import/no-extraneous-dependencies': 'off'
      }
    }
  ],
  ignorePatterns: [
    '**/dist/**',
    'webview/storybook-static/**',
    'extension/vscode-test/**',
    'extension/src/vscode.proposed.d.ts'
  ]
}
