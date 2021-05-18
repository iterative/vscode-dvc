#!/usr/bin/node

const { resolve, join } = require('path')
const { writeFileSync } = require('fs-extra')
const execa = require('execa')

let activationEvents = []
let failed
const packageJsonPath = resolve(__dirname, 'extension', 'package.json')

const cwd = join(__dirname, 'extension')

const packageJson = require(packageJsonPath)
activationEvents = packageJson.activationEvents
packageJson.activationEvents = ['onStartupFinished']
writeFileSync(packageJsonPath, JSON.stringify(packageJson))

const tsc = execa('tsc', ['-p', './'], {
  cwd
})

tsc.stdout.pipe(process.stdout)
tsc.stderr.pipe(process.stderr)
tsc.then(() => {
  const tests = execa('node', [join(cwd, 'dist', 'test', 'runTest.js')], {
    cwd
  })

  tests.stdout.pipe(process.stdout)
  tests.stderr.pipe(process.stderr)
  tests
    .then(() => {})
    .catch(() => {
      failed = true
    })
    .finally(() => {
      packageJson.activationEvents = activationEvents
      writeFileSync(packageJsonPath, JSON.stringify(packageJson))

      const prettier = execa('prettier', ['--write', 'package.json'], { cwd })
      prettier.stdout.pipe(process.stdout)
      prettier.stderr.pipe(process.stderr)
      prettier.then(() => {
        if (failed) {
          process.exit(1)
        }
      })
    })
})
