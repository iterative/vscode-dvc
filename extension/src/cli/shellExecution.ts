import { Config } from '../Config'
import { Commands } from './commands'

const getPATH = (pythonBinPath?: string): string => {
  if (!pythonBinPath) {
    return '$PATH'
  }
  return [pythonBinPath, '$PATH'].join(':')
}

export const getCommand = (config: Config, command: Commands): string => {
  const cliPath = config.dvcPath || 'dvc'
  const PATH = getPATH(config.pythonBinPath)
  return `PATH=${PATH} ${cliPath} ${command}`
}
