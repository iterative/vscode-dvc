'use strict'

const defaultExclude = require('@istanbuljs/schema/default-exclude')

module.exports = {
  extends: '@istanbuljs/nyc-config-typescript',
  extension: ['.ts', '.tsx'],
  tempDir: './coverage/combined',
  exclude: [...defaultExclude, '**/.vscode-test/**', '**/test/**']
}
