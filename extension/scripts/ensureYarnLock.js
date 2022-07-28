const { resolve } = require('path')
const { ensureFileSync } = require('fs-extra')

const yarnLock = resolve(__dirname, '..', 'yarn.lock')

ensureFileSync(yarnLock)
