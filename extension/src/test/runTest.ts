import * as path from 'path'

import { downloadAndUnzipVSCode, runTests } from 'vscode-test'

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '../../')

    const extensionTestsPath = path.resolve(__dirname, './suite/index')

    const vscodeExecutablePath = await downloadAndUnzipVSCode('insiders')

    const workspacePath = path.resolve(
      __dirname,
      '../../../demo/example-get-started'
    )

    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: ['--disable-extensions', workspacePath],
      vscodeExecutablePath
    })
  } catch (err) {
    console.error('Failed to run tests')
    process.exit(1)
  }
}

main()
