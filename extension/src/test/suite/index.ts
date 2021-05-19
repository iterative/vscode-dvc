/* eslint-disable sonarjs/cognitive-complexity */
import { join, resolve as resolvePath } from 'path'
import Mocha from 'mocha'
import glob from 'glob'
import { Logger } from '../../common/Logger'

function setupNyc() {
  const NYC = require('nyc')
  const defaultExclude = require('@istanbuljs/schema/default-exclude')

  const cwd = join(__dirname, '..', '..', '..')

  const nyc = new NYC({
    cache: true,
    cacheDir: join(cwd, '.cache', 'nyc'),
    cwd,
    exclude: [...defaultExclude, '**/.vscode-test/**'],
    hookRequire: true,
    hookRunInContext: true,
    hookRunInThisContext: true,
    instrument: true,
    reporter: ['text', 'html'],
    sourceMap: true,
    extensions: ['ts'],
    tempDirectory: join(cwd, 'coverage', 'integration')
  })
  nyc.reset()
  nyc.wrap()
  return nyc
}

export async function run() {
  const nyc = setupNyc()
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',
    color: true
  })

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
        } catch (e) {
          Logger.error(e)
          e(e)
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
