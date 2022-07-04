import { mkdirp } from 'fs-extra'
import { TEMP_DIR, ENV_DIR } from './constants'
require('../../vscode/mockModule')

const importModulesAfterMockingVsCode = () => {
  const { removeDir } = require('../../fileSystem')
  const { runMocha } = require('../util/mocha')
  const { setupVenv } = require('../../python')

  return { removeDir, runMocha, setupVenv }
}

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

// eslint-disable-next-line unicorn/prefer-top-level-await
main()
