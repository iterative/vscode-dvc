/* global module */
module.exports = {
  env: {
    'jest/globals': true
  },
  extends: [
    'prettier-standard/prettier-file',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:jest/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:sonarjs/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:unicorn/recommended'
  ],
  ignorePatterns: ['**/coverage/**', '**/dist/**'],
  overrides: [
    {
      extends: ['plugin:testing-library/react'],
      // Jest tests rely on a lot of undefined globals
      files: ['**/*.test.*'],
      rules: {
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        'no-undef': 'off',
        'sonarjs/no-duplicate-string': 'off',
        'testing-library/no-render-in-setup': 'off'
      }
    },
    {
      // Webpack dependencies are meant to be devDependencies
      files: ['**/*/webpack.config.[tj]s'],
      rules: {
        '@typescript-eslint/no-unsafe-return': 'off',
        'import/no-extraneous-dependencies': 'off'
      }
    },
    {
      files: ['**/*.tsx'],
      rules: {
        'unicorn/filename-case': [
          'error',
          {
            cases: {
              pascalCase: true
            },
            ignore: [/.*\.stories.tsx$/, /.*\.test\.tsx$/]
          }
        ]
      }
    },
    {
      files: ['**/util/*.tsx', '**/test/*.tsx'],
      rules: {
        'unicorn/filename-case': 'off'
      }
    }
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: [
    '@typescript-eslint',
    'check-file',
    'etc',
    'jest',
    'jsx-a11y',
    'react-hooks',
    'sonarjs',
    'sort-keys-fix',
    'testing-library',
    'unicorn'
  ],
  root: true,
  rules: {
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/member-delimiter-style': 'off',
    '@typescript-eslint/member-ordering': 'error',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-extra-semi': 'off',
    '@typescript-eslint/no-use-before-define': 'error',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/prefer-optional-chain': 'error',
    // Trust TS on this one -- Useful for functions that need to exhaust an enum.
    'array-callback-return': 'off',
    camelcase: 'off',
    curly: ['error', 'all'],
    'etc/no-commented-out-code': 'error',
    'import/no-unresolved': 'off',
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'index',
          'sibling',
          'parent',
          'internal',
          'object'
        ]
      }
    ],
    'jest/consistent-test-it': [
      'error',
      {
        fn: 'it',
        withinDescribe: 'it'
      }
    ],
    'jest/prefer-strict-equal': ['error'],
    // Let us wrap Radio components in labels.
    'jsx-a11y/label-has-associated-control': [
      2,
      {
        controlComponents: ['Radio']
      }
    ],
    'no-console': 'error',
    'no-restricted-globals': ['error', 'name', 'length', 'event'],
    'no-restricted-syntax': [
      'error',
      {
        message: 'Property getters are not allowed',
        selector: "MethodDefinition[kind='get']"
      },
      {
        message: 'Property setters are not allowed',
        selector: "MethodDefinition[kind='set']"
      }
    ],
    // https://github.com/typescript-eslint/typescript-eslint/issues/2540#issuecomment-692505191
    'no-use-before-define': 'off',
    quotes: ['error', 'single', { avoidEscape: true }],
    'react-hooks/exhaustive-deps': 'error',
    'react-hooks/rules-of-hooks': 'error',
    // This project doesn't use prop types
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'require-await': 'error',
    'security/detect-object-injection': 'off',
    'sonarjs/cognitive-complexity': ['error', 5],
    'sort-keys-fix/sort-keys-fix': 'warn',
    'unicorn/consistent-function-scoping': 'off',
    'unicorn/filename-case': 'off',
    'unicorn/import-style': 'off',
    'unicorn/no-array-callback-reference': 'off',
    'unicorn/no-null': 'off',
    'unicorn/no-process-exit': 'off',
    'unicorn/no-useless-undefined': 'off',
    'unicorn/numeric-separators-style': 'off',
    'unicorn/prefer-event-target': 'off',
    'unicorn/prefer-module': 'off',
    'unicorn/prefer-node-protocol': 'off',
    'unicorn/prefer-top-level-await': 'off',
    'unicorn/prevent-abbreviations': 'off'
  },
  settings: {
    linkComponents: [{ linkAttribute: 'to', name: 'Link' }],
    react: {
      version: 'detect'
    }
  }
}
