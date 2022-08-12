import { join, resolve } from 'path'
import { mkdirp } from 'fs-extra'
import { Options } from '@wdio/types'
import { getVenvBinPath } from '../../python/path'
import { Logger } from '../../common/logger'

const screenshotDir = join(__dirname, 'screenshots')
const logsDir = join(__dirname, 'logs')
const extensionPath = resolve(__dirname, '..', '..', '..')
const dvcDemoPath = resolve(extensionPath, '..', 'demo')

export const config: Options.Testrunner = {
  after: async function () {
    await browser.switchToFrame(null)
    await browser.switchToFrame(null)
  },
  afterTest: async (test, __, { passed }) => {
    if (passed) {
      return
    }

    Logger.log('Capturing screenshot for debugging')

    await browser.saveScreenshot(
      join(screenshotDir, `${test.parent} - ${test.title}.png`)
    )
  },
  baseUrl: 'http://localhost',
  before: async function () {
    mkdirp(screenshotDir)
    await browser.setWindowSize(1600, 1200)
  },
  capabilities: [
    {
      browserName: 'vscode',
      browserVersion: 'insiders',
      'wdio:vscodeOptions': {
        extensionPath,
        userSettings: {
          'dvc.pythonPath': getVenvBinPath(dvcDemoPath, '.env', 'python')
        },
        verboseLogging: false,
        workspacePath: dvcDemoPath
      }
    }
  ],
  connectionRetryCount: 3,
  connectionRetryTimeout: 120000,
  framework: 'mocha',
  maxInstances: 1,
  mochaOpts: {
    bail: true,
    parallel: false,
    retries: 0,
    timeout: 60000,
    ui: 'bdd'
  },
  outputDir: logsDir,
  reporters: ['spec'],
  services: ['vscode'],
  specs: ['./src/test/e2e/*.test.ts'],
  waitforTimeout: 10000
}
