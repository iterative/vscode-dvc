'use strict'

const defaultExclude = require('@istanbuljs/schema/default-exclude')
const isWindows = require('is-windows')

const platformExclude = [isWindows() ? 'lib/posix.js' : 'lib/win32.js']

module.exports = {
  exclude: platformExclude.concat(defaultExclude).concat('**/.vscode-test/**')
}
