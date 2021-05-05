import { resolve } from 'path'

import { downloadAndUnzipVSCode, runTests } from 'vscode-test'
import { Logger } from '../common/Logger'

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

main()
