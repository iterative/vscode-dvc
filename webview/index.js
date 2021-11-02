/* global module, require, __dirname */
/* eslint-disable @typescript-eslint/no-var-requires */

// This is the entry point when this package is used as library from the extension.
// This package MUST NOT be bundled.
const path = require('path')

module.exports.distPath = path.join(__dirname, 'dist')
module.exports.experiments = path.join(__dirname, 'dist/experiments.js')
module.exports.plots = path.join(__dirname, 'dist/plots.js')
module.exports.react = path.join(__dirname, 'dist/react.js')
