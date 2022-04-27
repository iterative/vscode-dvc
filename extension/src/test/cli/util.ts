import { join } from 'path'
import { TEMP_DIR, ENV_DIR } from './constants'
import { CliExecutor } from '../../cli/executor'
import { CliReader } from '../../cli/reader'
import { Config } from '../../config'
import { exists } from '../../fileSystem'
import { getVenvBinPath } from '../../python'
import { dvcDemoPath } from '../util'

const config = {
  getCliPath: () => '',
  pythonBinPath: getVenvBinPath(TEMP_DIR, ENV_DIR, 'python')
} as Config

export const cliReader = new CliReader(config)
export const cliExecutor = new CliExecutor(config)

let demoInitialized: Promise<string>
export const initializeDemoRepo = (): Promise<string> => {
  if (!demoInitialized) {
    demoInitialized = cliExecutor.pull(dvcDemoPath)
  }
  return demoInitialized
}

export const initializeEmptyRepo = (): Promise<string> => {
  if (exists(join(TEMP_DIR, '.dvc'))) {
    return Promise.resolve('')
  }

  return cliExecutor.init(TEMP_DIR)
}
