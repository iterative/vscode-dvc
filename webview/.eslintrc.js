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
    '@typescript-eslint/no-use-before-define': ['error'],
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/no-object-literal-type-assertion': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'no-console': 'off',
    'max-classes-per-file': 'off',
    'class-methods-use-this': 'off',
    // import
    'import/prefer-default-export': 'off',
    'import/no-unresolved': 'off',
    'import/extensions': 'off',
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
    'import/core-modules': ['vscode', 'dvc-integration']
  },
  overrides: [
    {
      files: ['webpack.config.ts'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'import/no-extraneous-dependencies': 'off'
      }
    },
    {
      files: ['*.test.js'],
      rules: {
        'no-undef': 'off'
      }
    },
    {
      files: ['src/**/*.ts'],
      parserOptions: {
        sourceType: 'module',
        project: './tsconfig.json'
      }
    }
  ],
  ignorePatterns: ['/dist/**', '/github-action/**']
}
