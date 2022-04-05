import { join } from 'path'
import { URI } from 'vscode-uri'
import { stub } from 'sinon'
import mock from 'mock-require'
import { removeDir } from '../../fileSystem'
import { setupVenv } from '../../python'
import { runMocha } from '../util/mocha'

const envDir = '.env'
const cwd = __dirname

mock('vscode', {
  EventEmitter: stub(),
  Uri: {
    file: URI.file
  }
})
mock('@hediet/std/disposable', {
  Disposable: {
    fn: () => ({
      track: <T>(disposable: T): T => disposable,
      untrack: () => undefined
    })
  }
})

runMocha(
  __dirname,
  'ts',
  async () => {
    await setupVenv(cwd, envDir, 'git+https://github.com/iterative/dvc')
  },
  () => {
    removeDir(join(cwd, envDir))
  }
)
