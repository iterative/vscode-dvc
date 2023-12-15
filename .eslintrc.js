/* global module */
module.exports = {
  env: {
    'jest/globals': true
  },

  extends: [
    'prettier-standard/prettier-file',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
    'plugin:jest/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:sonarjs/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:unicorn/recommended'
  ],
  ignorePatterns: [
    '**/coverage/**',
    '**/dist/**',
    '**/*.js',
    '*.d.ts',
    'tsconfig.json',
    'webpack.config.ts',
    'scripts/virtualenv-install.ts'
  ],
  overrides: [
    {
      extends: ['plugin:testing-library/react'],
      // Jest tests rely on a lot of undefined globals
      files: ['**/*.test.*'],
      rules: {
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/unbound-method': 'off',
        'no-undef': 'off',
        'sonarjs/no-duplicate-string': 'off',
        'testing-library/no-render-in-setup': 'off',
        'testing-library/render-result-naming-convention': 'off'
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
            ignore: [/.*\.stories.tsx$/, /.*\.test\.tsx$/, /.*use.*\.tsx$/]
          }
        ]
      }
    },
    {
      files: ['**/util/*.tsx', '**/test/*.tsx'],
      rules: {
        'unicorn/filename-case': 'off'
      }
    },
    {
      files: [
        'src/extension.ts',
        '**/*.stories.tsx',
        '**/stories/util.ts',
        '**/__mocks__/**',
        'src/test/util/index.ts',
        'src/test/e2e/**',
        'src/test/suite/index.ts',
        '**/*Slice.ts',
        '**/store.ts',
        '**/contract.ts'
      ],
      rules: {
        'import/no-unused-modules': 'off'
      }
    },
    {
      files: ['**/stories/**', '**/__mocks__/**'],
      rules: {
        'react/no-multi-comp': 'off'
      }
    }
  ],
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
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-use-before-define': 'error',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/prefer-optional-chain': 'error',
    // Trust TS on this one -- Useful for functions that need to exhaust an enum.
    'array-callback-return': 'off',
    camelcase: 'off',
    curly: ['error', 'all'],
    'etc/no-commented-out-code': 'error',
    'etc/no-assign-mutated-array': 'error',
    'import/no-unresolved': 'off',
    'import/no-unused-modules': [2, { unusedExports: true }],
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
    'no-void': ['error', { allowAsStatement: true }],
    'no-warning-comments': 'error',
    quotes: ['error', 'single', { avoidEscape: true }],
    'react/jsx-curly-brace-presence': [
      'error',
      { props: 'never', children: 'never' }
    ],
    'react-hooks/exhaustive-deps': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react/no-multi-comp': 'error',
    // This project doesn't use prop types
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'require-await': 'error',
    'security/detect-object-injection': 'off',
    'sonarjs/cognitive-complexity': ['error', 6],
    'sort-keys-fix/sort-keys-fix': 'warn',
    'unicorn/consistent-function-scoping': 'off',
    'unicorn/filename-case': 'off',
    'unicorn/import-style': 'off',
    'unicorn/no-array-callback-reference': 'off',
    'unicorn/no-null': 'off',
    'unicorn/no-process-exit': 'off',
    'unicorn/no-useless-undefined': 'off',
    'unicorn/numeric-separators-style': 'off',
    'unicorn/prefer-at': 'off',
    'unicorn/prefer-event-target': 'off',
    'unicorn/prefer-module': 'off',
    'unicorn/prefer-node-protocol': 'off',
    'unicorn/prefer-string-replace-all': 'off',
    'unicorn/prefer-top-level-await': 'off',
    'unicorn/prevent-abbreviations': 'off',
    'unicorn/switch-case-braces': 'off'
  },
  settings: {
    linkComponents: [{ linkAttribute: 'to', name: 'Link' }],
    react: {
      version: 'detect'
    }
  }
}
