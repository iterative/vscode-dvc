module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module'
  },
  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'prettier/@typescript-eslint'
  ],
  plugins: ['import', 'prettier', '@typescript-eslint'],
  env: {
    browser: false,
    es6: true
  },
  rules: {
    'no-shadow': 'off',
    'no-use-before-define': 'off',
    'no-nested-ternary': 'off',
    camelcase: 'off',
    // prettier
    'prettier/prettier': ['error'],
    // TypeScript
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/no-object-literal-type-assertion': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'no-console': 'off',
    'max-classes-per-file': 'off',
    'class-methods-use-this': 'off',
    // import
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        mjs: 'never',
        ts: 'never'
      }
    ],
    'import/prefer-default-export': 'off',
    'no-underscore-dangle': 'off',
    'no-restricted-syntax': 'off',
    'no-param-reassign': 'off'
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts', '.json']
      }
    },
    'import/extensions': ['.js', '.ts', '.mjs'],
    'import/core-modules': ['vscode', 'dvc-vscode-webview', 'dvc-integration']
  },
  overrides: [
    {
      files: ['**/*.{ts,tsx}'],
      rules: {
        'import/extensions': 'off',
        'import/no-unresolved': 'off'
      }
    },
    {
      files: ['**/webpack.config.ts'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'import/no-extraneous-dependencies': 'off'
      }
    },
    {
      files: ['**/*.test.js'],
      rules: {
        'no-undef': 'off'
      }
    }
  ],
  ignorePatterns: ['**/dist/**']
}
