import { getProcessEnv } from '../env'
import { Commands } from './commands'

const getPATH = (existingPath: string, pythonBinPath?: string): string =>
  [pythonBinPath, existingPath].filter(Boolean).join(':')

const getEnv = (pythonBinPath?: string): NodeJS.ProcessEnv => {
  const env = getProcessEnv()
  const PATH = getPATH(env?.PATH as string, pythonBinPath)
  return {
    ...env,
    PATH
  }
}

export const getCommand = (command: Commands, cliPath?: string): string =>
  `${cliPath || 'dvc'} ${command}`

export interface ExecutionOptions {
  cliPath: string | undefined
  pythonBinPath: string | undefined
  cwd: string
}

export const getExecutionDetails = (
  options: ExecutionOptions,
  command: Commands
): {
  env: NodeJS.ProcessEnv
  command: string
} => {
  return {
    env: getEnv(options.pythonBinPath),
    command: getCommand(command, options.cliPath)
  }
}
