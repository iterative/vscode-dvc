import { join } from 'path'
import { TEMP_DIR, ENV_DIR } from './constants'
import { DvcExecutor } from '../../cli/dvc/executor'
import { DvcReader } from '../../cli/dvc/reader'
import { Config } from '../../config'
import { exists } from '../../fileSystem'
import { getVenvBinPath } from '../../python/path'
import { dvcDemoPath } from '../util'
import { GitExecutor } from '../../cli/git/executor'

const config = {
  getCliPath: () => '',
  getPythonBinPath: () => getVenvBinPath(TEMP_DIR, ENV_DIR, 'python')
} as Config

export const dvcReader = new DvcReader(config)
export const dvcExecutor = new DvcExecutor(config)
const gitExecutor = new GitExecutor()

let demoInitialized: Promise<string>
export const initializeDemoRepo = (): Promise<string> => {
  if (!demoInitialized) {
    demoInitialized = dvcExecutor.pull(dvcDemoPath)
  }
  return demoInitialized
}

export const initializeEmptyRepo = async (): Promise<string> => {
  if (exists(join(TEMP_DIR, '.dvc'))) {
    return ''
  }

  await gitExecutor.init(TEMP_DIR)

  return dvcExecutor.init(TEMP_DIR)
}
