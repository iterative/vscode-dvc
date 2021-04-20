import { getProcessEnv } from '../env'
import { Commands } from './commands'

export interface ReaderOptions {
  cliPath: string | undefined
  pythonBinPath: string | undefined
  cwd: string
}

export type ExecutionOptions = ReaderOptions & {
  command: Commands | string
}

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

const getCommand = (command: Commands | string, cliPath?: string): string =>
  `${cliPath || 'dvc'} ${command}`

export const getExecutionDetails = (
  options: ExecutionOptions
): {
  command: string
  cwd: string
  env: NodeJS.ProcessEnv
} => {
  return {
    env: getEnv(options.pythonBinPath),
    command: getCommand(options.command, options.cliPath),
    cwd: options.cwd
  }
}
