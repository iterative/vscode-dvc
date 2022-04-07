import { join } from 'path'
import { TEMP_DIR, ENV_DIR } from './constants'
import { CliExecutor } from '../../cli/executor'
import { CliReader } from '../../cli/reader'
import { Config } from '../../config'
import { exists } from '../../fileSystem'
import { getVenvBinPath } from '../../python'

const config = {
  getCliPath: () => getVenvBinPath(TEMP_DIR, ENV_DIR, 'dvc')
} as Config

export const cliReader = new CliReader(config)
export const cliExecutor = new CliExecutor(config)

export const initializeEmptyDvc = (): Promise<string> => {
  if (exists(join(TEMP_DIR, '.dvc'))) {
    return Promise.resolve('')
  }

  return cliExecutor.init(TEMP_DIR)
}
