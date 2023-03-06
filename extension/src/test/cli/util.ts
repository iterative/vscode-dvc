import { join } from 'path'
import { TEMP_DIR, ENV_DIR } from './constants'
import { DvcExecutor } from '../../cli/dvc/executor'
import { DvcReader } from '../../cli/dvc/reader'
import { Config } from '../../config'
import { exists } from '../../fileSystem'
import { getVenvBinPath } from '../../python/path'
import { dvcDemoPath } from '../util'
import { GitExecutor } from '../../cli/git/executor'
import { DOT_DVC } from '../../cli/dvc/constants'

const config = {
  getCliPath: () => '',
  getPythonBinPath: () => getVenvBinPath(TEMP_DIR, ENV_DIR, 'python')
} as Config

export const dvcReader = new DvcReader(config)
export const dvcExecutor = new DvcExecutor(config, () => undefined)
const gitExecutor = new GitExecutor()

let demoInitialized: Promise<string>
export const initializeDemoRepo = (): Promise<string> => {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  if (!demoInitialized) {
    demoInitialized = dvcExecutor.pull(dvcDemoPath)
  }
  return demoInitialized
}

export const initializeEmptyRepo = async (): Promise<string> => {
  if (exists(join(TEMP_DIR, DOT_DVC))) {
    return ''
  }

  await gitExecutor.init(TEMP_DIR)

  return dvcExecutor.init(TEMP_DIR)
}
