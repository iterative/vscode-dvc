import { Config } from '../Config'
import { getProcessEnv } from '../env'
import { Commands } from './commands'

const getPATH = (existingPath: string, pythonBinPath?: string): string =>
  [pythonBinPath, existingPath].filter(Boolean).join(':')

const getEnv = (config: Config): NodeJS.ProcessEnv => {
  const env = getProcessEnv()
  const PATH = getPATH(env?.PATH as string, config.pythonBinPath)
  return {
    ...env,
    PATH
  }
}

export const getCommand = (config: Config, command: Commands): string => {
  const cliPath = config.dvcPath || 'dvc'
  return `${cliPath} ${command}`
}

export const getExecutionDetails = (
  config: Config,
  command: Commands
): {
  env: NodeJS.ProcessEnv
  command: string
} => {
  return {
    env: getEnv(config),
    command: getCommand(config, command)
  }
}
