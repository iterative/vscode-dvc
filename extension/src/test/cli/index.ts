import { mkdirp } from 'fs-extra'
import { URI } from 'vscode-uri'
import { stub } from 'sinon'
import mock from 'mock-require'
import { TEMP_DIR, ENV_DIR } from './constants'

const importModulesAfterMockingVsCode = () => {
  const { removeDir } = require('../../fileSystem')
  const { runMocha } = require('../util/mocha')
  const { setupVenv } = require('../../python')

  return { removeDir, runMocha, setupVenv }
}

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

const { setupVenv, removeDir, runMocha } = importModulesAfterMockingVsCode()

async function main() {
  try {
    await runMocha(
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
      20000
    )
  } catch {
    process.exit(1)
  }
}

main()
