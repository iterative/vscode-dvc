import { join } from 'path'
import { TEMP_DIR, ENV_DIR } from './constants'
import { DvcExecutor } from '../../cli/dvc/executor'
import { DvcReader } from '../../cli/dvc/reader'
import { Config } from '../../config'
import { exists } from '../../fileSystem'
import { getVenvBinPath } from '../../python/path'
import { dvcDemoPath } from '../util'

const config = {
  getCliPath: () => '',
  pythonBinPath: getVenvBinPath(TEMP_DIR, ENV_DIR, 'python')
} as Config

export const dvcReader = new DvcReader(config)
export const dvcExecutor = new DvcExecutor(config)

let demoInitialized: Promise<string>
export const initializeDemoRepo = (): Promise<string> => {
  if (!demoInitialized) {
    demoInitialized = dvcExecutor.pull(dvcDemoPath)
  }
  return demoInitialized
}

export const initializeEmptyRepo = (): Promise<string> => {
  if (exists(join(TEMP_DIR, '.dvc'))) {
    return Promise.resolve('')
  }

  return dvcExecutor.init(TEMP_DIR)
}
