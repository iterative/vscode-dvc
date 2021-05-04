/* eslint consistent-return: off */
/* eslint no-shadow: off */
import { resolve as resolvePath } from 'path'
import Mocha from 'mocha'
import glob from 'glob'
import { Logger } from '../../common/Logger'
import { beforeAll } from './hooks'

export function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
    rootHooks: {
      beforeAll
    }
  })

  const testsRoot = resolvePath(__dirname, '..')

  // eslint-disable-next-line sonarjs/cognitive-complexity
  return new Promise((resolve, reject) => {
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
}
