'use strict'

const defaultExclude = require('@istanbuljs/schema/default-exclude')

module.exports = {
  all: true,
  extends: '@istanbuljs/nyc-config-typescript'
  //   exclude: [
  //     ...defaultExclude,
  //     '**/.vscode-test/**',
  //     '**/test/**',
  //     '**/*.config.*',
  //     '**/__mocks__/**',
  //     '**/testHelpers.*',
  //     '**/.cache/**'
  //   ]
}
