/* global module */

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'jest', 'react-hooks', 'jsx-a11y', 'sonarjs'],
  extends: [
    'prettier-standard/prettier-file',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:jest/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:sonarjs/recommended'
  ],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/member-delimiter-style': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-extra-semi': 'off',
    camelcase: 'off',
    'security/detect-object-injection': 'off',
    'no-restricted-globals': ['error', 'name', 'length', 'event'],
    'react/react-in-jsx-scope': 'off',
    'no-console': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'error',
    // Trust TS on this one -- Useful for functions that need to exhaust an enum.
    'array-callback-return': 'off',
    // https://github.com/typescript-eslint/typescript-eslint/issues/2540#issuecomment-692505191
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': 'error',
    '@typescript-eslint/no-explicit-any': 'error',

    // Let us wrap Radio components in labels.
    'jsx-a11y/label-has-associated-control': [
      2,
      {
        controlComponents: ['Radio']
      }
    ],

    // vscode-dvc specific

    // This project doesn't use prop types
    'react/prop-types': 'off',
    curly: ['error', 'all'],
    '@typescript-eslint/prefer-optional-chain': 'error',
    'require-await': 'error',
    'sonarjs/cognitive-complexity': ['error', 5]
  },
  env: {
    'jest/globals': true
  },
  settings: {
    react: {
      version: 'detect'
    },
    linkComponents: [{ name: 'Link', linkAttribute: 'to' }]
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    }
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
        'import/no-extraneous-dependencies': 'off',
        '@typescript-eslint/no-unsafe-return': 'off'
      }
    },
    {
      files: ['extension/src/test/suite/**/*'],
      rules: {
        // These aren't jest tests, but still use `expect`
        'jest/valid-expect': 'off',
        'no-unused-expressions': 'off'
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
