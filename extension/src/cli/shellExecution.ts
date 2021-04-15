import { Config } from '../Config'
import { Commands } from './commands'
import { getProcessEnv } from '../env'

const getPATH = (existingPath: string, pythonBinPath?: string): string => {
  if (!pythonBinPath) {
    return existingPath
  }
  if (!existingPath) {
    return pythonBinPath
  }

  return [pythonBinPath, existingPath].join(':')
}

const getEnv = (config: Config): Record<string, unknown> => {
  const env = getProcessEnv()
  const existingPath = (env?.PATH as string) || ''
  const PATH = getPATH(existingPath, config.pythonBinPath)
  return {
    ...env,
    PATH
  }
}

export const getCommand = (config: Config, command: Commands): string => {
  const cliPath = config.dvcPath || 'dvc'
  const PATH = getEnv(config).PATH
  return `PATH=${PATH} ${cliPath} ${command}`
}
