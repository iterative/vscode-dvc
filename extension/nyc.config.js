'use strict'

const defaultExclude = require('@istanbuljs/schema/default-exclude')

module.exports = {
  extends: '@istanbuljs/nyc-config-typescript',
  extension: ['.ts', '.tsx'],
  exclude: [...defaultExclude, '**/.vscode-test/**', '**/test/**']
}
