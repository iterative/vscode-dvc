#!/usr/bin/node

const argv = require('yargs/yargs')(process.argv.slice(2)).argv
const { resolve } = require('path')
const { writeFileSync } = require('fs-extra')

let activationEvents = []
let packageJson
const packageJsonPath = resolve(__dirname, '..', '..', 'package.json')

if (argv.ci && argv.cover) {
  packageJson = require(packageJsonPath)
  activationEvents = packageJson.activationEvents
  packageJson.activationEvents = ['onStartupFinished']
  writeFileSync(packageJsonPath, JSON.stringify(packageJson))

  const execa = require('execa')
  execa('tsc', ['-p', './']).then(() => {
    packageJson.activationEvents = activationEvents
    writeFileSync(packageJsonPath, JSON.stringify(packageJson))
  })
}
