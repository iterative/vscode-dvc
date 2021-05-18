import { writeFileSync } from 'fs-extra'
import { resolve } from 'path'
import { downloadAndUnzipVSCode, runTests } from 'vscode-test'
import { Logger } from '../common/Logger'
import { definedAndNonEmpty } from '../util'

const argv = require('yargs/yargs')(process.argv.slice(2)).argv

async function main() {
  try {
    const extensionDevelopmentPath = resolve(__dirname, '../../')

    const extensionTestsPath = resolve(__dirname, './suite/index')

    const vscodeExecutablePath = await downloadAndUnzipVSCode('insiders')

    const workspacePath = resolve(__dirname, '../../../demo')

    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: ['--disable-extensions', workspacePath],
      vscodeExecutablePath
    })
  } catch (err) {
    Logger.error('Failed to run tests')
    process.exit(1)
  }
}

let activationEvents = []
let packageJson
const packageJsonPath = resolve(__dirname, '..', '..', 'package.json')

if (argv.ci && argv.cover) {
  packageJson = require(packageJsonPath)
  activationEvents = packageJson.activationEvents
  packageJson.activationEvents = ['onStartupFinished']
  writeFileSync(packageJsonPath, JSON.stringify(packageJson))
}

main()

if (argv.ci && argv.cover && definedAndNonEmpty(activationEvents)) {
  packageJson.activationEvents = activationEvents
  writeFileSync(packageJsonPath, JSON.stringify(packageJson))
}
