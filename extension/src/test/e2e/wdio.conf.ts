import { join, resolve } from 'path'
import { mkdirp } from 'fs-extra'
import { Options } from '@wdio/types'
import { getVenvBinPath } from '../../python/path'
import { Logger } from '../../common/logger'

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

    const screenshotDir = join(__dirname, 'screenshots')
    mkdirp(screenshotDir)
    await browser.saveScreenshot(
      join(screenshotDir, `${test.parent} - ${test.title}.png`)
    )
  },
  baseUrl: 'http://localhost',
  before: async function () {
    await browser.setWindowSize(1600, 1200)
  },
  capabilities: [
    {
      browserName: 'vscode',
      browserVersion: 'insiders',
      // @ts-expect-error these caps are not typed in WebdriverIO
      'wdio:vscodeOptions': {
        extensionPath: resolve(__dirname, '..', '..', '..'),
        userSettings: {
          'dvc.pythonPath': getVenvBinPath(
            resolve(__dirname, '..', '..', '..', '..', 'demo'),
            '.env',
            'python'
          )
        },
        verboseLogging: false,
        workspacePath: resolve(__dirname, '..', '..', '..', '..', 'demo')
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
  outputDir: join(__dirname, 'logs'),
  reporters: ['spec'],
  services: ['vscode'],
  specs: ['./src/test/e2e/*.test.ts'],
  waitforTimeout: 10000
}
