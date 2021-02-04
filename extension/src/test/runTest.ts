import { spawnSync } from 'child_process'
import { resolve } from 'path'

import {
  downloadAndUnzipVSCode,
  resolveCliPathFromVSCodeExecutablePath,
  runTests
} from 'vscode-test'

async function main() {
  try {
    const extensionDevelopmentPath = resolve(__dirname, '../../')

    const extensionTestsPath = resolve(__dirname, './suite/index')

    const vscodeExecutablePath = await downloadAndUnzipVSCode('insiders')

    const workspacePath = resolve(__dirname, '../../../demo')

    const cliPath = resolveCliPathFromVSCodeExecutablePath(vscodeExecutablePath)

    spawnSync(
      cliPath,
      ['--install-extension', 'ms-python.python', '--enable-proposed-api'],
      {
        encoding: 'utf-8',
        stdio: 'inherit'
      }
    )

    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [workspacePath],
      vscodeExecutablePath
    })
  } catch (err) {
    console.error('Failed to run tests')
    process.exit(1)
  }
}

main()
