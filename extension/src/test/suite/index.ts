/* eslint-disable sonarjs/cognitive-complexity */
import { join, resolve as resolvePath } from 'path'
import Mocha from 'mocha'
import glob from 'glob'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinonChai from 'sinon-chai'
import { Logger } from '../../common/logger'

function setupNyc() {
  const NYC = require('nyc')
  const defaultExclude = require('@istanbuljs/schema/default-exclude')

  const cwd = join(__dirname, '..', '..', '..')

  const nyc = new NYC({
    cache: true,
    cacheDir: join(cwd, '.cache', 'nyc'),
    cwd,
    exclude: [...defaultExclude, '**/test/**', '**/.vscode-test/**'],
    extensions: ['ts'],
    hookRequire: true,
    hookRunInContext: true,
    hookRunInThisContext: true,
    instrument: true,
    reporter: ['text', 'html'],
    sourceMap: true,
    tempDirectory: join(cwd, 'coverage', 'integration')
  })
  nyc.reset()
  nyc.wrap()
  return nyc
}

export async function run() {
  const nyc = setupNyc()

  const mocha = new Mocha({
    checkLeaks: true,
    color: true,
    reporterOptions: { maxDiffSize: 0 },
    timeout: 4000,
    ui: 'tdd'
  })

  chai.use(sinonChai)
  chai.use(chaiAsPromised)

  const testsRoot = resolvePath(__dirname, '..')

  try {
    await new Promise<void>((resolve, reject) => {
      glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
        if (err) {
          return reject(err)
        }

        // Add files to the test suite
        files.forEach(f => mocha.addFile(resolvePath(testsRoot, f)))

        try {
          // Run the mocha test
          mocha.run(failures => {
            if (failures > 0) {
              reject(new Error(`${failures} tests failed.`))
            } else {
              resolve()
            }
          })
        } catch (e: unknown) {
          Logger.error((e as Error).toString())
          throw e
        }
      })
    })
  } finally {
    if (nyc) {
      nyc.writeCoverageFile()
      nyc.report()
    }
  }
}
