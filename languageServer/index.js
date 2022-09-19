/* global module, require, __dirname */
/* eslint-disable @typescript-eslint/no-var-requires */

// This is the entry point when this package is used as library from the extension.
// This package MUST NOT be bundled.
const path = require('path')

module.exports.serverModule = path.join(__dirname, 'dist', 'server.js')
module.exports.documentSelector = [
  {
    language: 'yaml'
  },
  {
    pattern: '**/*.{dvc,dvc.lock}'
  },
  {
    language: 'json'
  },
  {
    language: 'toml'
  },
  {
    language: 'python'
  }
]
