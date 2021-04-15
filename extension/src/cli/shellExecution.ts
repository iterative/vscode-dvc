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

export const getExecutionDetails = (
  config: Config,
  command: Commands,
  cwd: string
): {
  executionCommand: string
  outputCommand: string
  env: NodeJS.ProcessEnv
  cwd: string
} => {
  const cliPath = config.dvcPath || 'dvc'
  const env = getEnv(config)
  return {
    executionCommand: `${cliPath} ${command}`,
    outputCommand: `dvc ${command}`,
    env,
    cwd
  }
}
