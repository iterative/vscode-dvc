import { join, resolve } from 'path'
import { Options } from '@wdio/types'

export const config: Options.Testrunner = {
  after: async function () {
    await browser.switchToFrame(null)
    await browser.switchToFrame(null)
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
    retries: 0,
    timeout: 60000,
    ui: 'bdd'
  },
  outputDir: join(__dirname, 'logs'),
  reporters: ['spec'],
  services: ['vscode'],
  specs: ['./src/test/e2e/*.e2e.ts'],
  waitforTimeout: 10000
}
