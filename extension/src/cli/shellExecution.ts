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

const getEnv = (config: Config): NodeJS.ProcessEnv => {
  const env = getProcessEnv()
  const existingPath = (env?.PATH as string) || ''
  const PATH = getPATH(existingPath, config.pythonBinPath)
  return {
    ...env,
    PATH
  }
}

export interface cliExecutionDetails {
  cwd: string
  env: NodeJS.ProcessEnv
  executionCommand: string
  outputCommand: string
}

export const getExecutionDetails = (
  config: Config,
  command: Commands,
  cwd: string
): cliExecutionDetails => {
  const cliPath = config.dvcPath || 'dvc'
  const env = getEnv(config)
  return {
    cwd,
    env,
    executionCommand: `${cliPath} ${command}`,
    outputCommand: `dvc ${command}`
  }
}
