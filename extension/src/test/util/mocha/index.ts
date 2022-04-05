import { resolve as resolvePath } from 'path'
import Mocha from 'mocha'
import glob from 'glob'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import { Logger } from '../../../common/logger'

export const runMocha = async (
  cwd: string,
  ext: 'ts' | 'js',
  setup: () => Promise<void> | void,
  teardown: () => Promise<void> | void
) => {
  await setup()

  const mocha = new Mocha({
    checkLeaks: true,
    color: true,
    reporterOptions: { maxDiffSize: 0 },
    timeout: 4000,
    ui: 'tdd'
  })

  chai.use(sinonChai)
  chai.use(chaiAsPromised)

  try {
    // eslint-disable-next-line sonarjs/cognitive-complexity
    await new Promise<void>((resolve, reject) => {
      glob(`**/**.test.${ext}`, { cwd }, (err, files) => {
        if (err) {
          return reject(err)
        }

        // Add files to the test suite
        for (const f of files) {
          mocha.addFile(resolvePath(cwd, f))
        }

        try {
          // Run the mocha test
          mocha.run(failures => {
            if (failures > 0) {
              reject(new Error(`${failures} tests failed.`))
            } else {
              resolve()
            }
          })
        } catch (error: unknown) {
          Logger.error((error as Error).toString())
          throw error
        }
      })
    })
  } finally {
    await teardown()
  }
}
