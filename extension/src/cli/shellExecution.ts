import { Config } from '../Config'
import { Commands } from './commands'
import { getProcessEnv } from '../env'

const getPATHString = (
  existingPath: string,
  pythonBinPath?: string
): string => {
  if (!pythonBinPath) {
    return existingPath
  }
  if (!existingPath) {
    return pythonBinPath
  }

  return [pythonBinPath, existingPath].join(':')
}

export const getCommand = (config: Config, command: Commands): string => {
  const cliPath = config.dvcPath || 'dvc'
  const env = getProcessEnv()
  const existingPath = (env?.PATH as string) || ''
  const PATH = getPATHString(existingPath, config.pythonBinPath)
  return `PATH=${PATH} ${cliPath} ${command}`
}
