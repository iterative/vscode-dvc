import { mkdirp } from 'fs-extra'
import { URI } from 'vscode-uri'
import { stub } from 'sinon'
import mock from 'mock-require'
import { TEMP_DIR, ENV_DIR } from './constants'
import { removeDir } from '../../fileSystem'
import { setupVenv } from '../../python'
import { runMocha } from '../util/mocha'

class MockEventEmitter {
  public fire() {
    return stub()
  }

  public event() {
    return stub()
  }
}

mock('vscode', {
  EventEmitter: MockEventEmitter,
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
    await mkdirp(TEMP_DIR)
    await setupVenv(
      TEMP_DIR,
      ENV_DIR,
      'git+https://github.com/iterative/dvc#egg=dvc[s3]'
    )
  },
  () => {
    removeDir(TEMP_DIR)
  },
  6000
)
