import { resolve } from 'path'
import { downloadAndUnzipVSCode, runTests } from '@vscode/test-electron'
import { Logger } from '../common/logger'

async function main() {
  try {
    process.env.VSC_TEST = 'true'

    const extensionDevelopmentPath = resolve(__dirname, '../../')

    const extensionTestsPath = resolve(__dirname, './suite/index')

    const vscodeExecutablePath = await downloadAndUnzipVSCode('insiders')

    const workspacePath = resolve(__dirname, '../../../demo')

    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [
        '--disable-extensions',
        '--disable-workspace-trust',
        workspacePath
      ],
      vscodeExecutablePath
    })
  } catch {
    Logger.error('Failed to run tests')
    process.exit(1)
  }
}

main()
