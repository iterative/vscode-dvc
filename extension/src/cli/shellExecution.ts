import { Config } from '../Config'
import { Commands } from './commands'
import { getProcessEnv } from '../env'

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
