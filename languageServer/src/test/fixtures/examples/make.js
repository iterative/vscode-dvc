const fs = require('fs-jetpack')

const validDir = fs.cwd('valid')
const invalidDir = fs.cwd('invalid')
invalidDir.find({ matching: '*.yaml' }).forEach(path => {
  const constName = path.replace(/\./g, '_')
  const code =
    'export const ' + constName + ' = `\n' + invalidDir.read(path) + '\n`'
  const clean = code.replace(/\$/g, '\\$')
  invalidDir.append('index.ts', clean + '\n')
})
