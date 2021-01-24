import * as path from 'path'

import { downloadAndUnzipVSCode, runTests } from 'vscode-test'

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '../../')

    const extensionTestsPath = path.resolve(__dirname, './suite/index')

    const workspacePath = path.resolve(
      __dirname,
      '../../../demo/example-get-started'
    )

    const vscodeExecutablePath = await downloadAndUnzipVSCode('insiders')

    await runTests({
      extensionDevelopmentPath,
      vscodeExecutablePath,
      extensionTestsPath,
      launchArgs: ['--disable-extensions', workspacePath]
    })
  } catch (err) {
    console.error('Failed to run tests')
    process.exit(1)
  }
}

main()
