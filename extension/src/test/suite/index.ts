import { join } from 'path'
import { runMocha } from '../util/mocha'

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

export function run() {
  let nyc: { writeCoverageFile: () => void; report: () => void }

  return runMocha(
    __dirname,
    'js',
    () => {
      nyc = setupNyc()
    },
    () => {
      if (nyc) {
        nyc.writeCoverageFile()
        nyc.report()
      }
    }
  )
}
