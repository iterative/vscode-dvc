import { Config } from '../Config'
import { Commands } from './commands'
import { getPATH } from '../env'

const getPATHString = (pythonBinPath?: string): string => {
  const existingPath = getPATH()
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
  const PATH = getPATHString(config.pythonBinPath)
  return `PATH=${PATH} ${cliPath} ${command}`
}
