import { getProcessEnv } from '../env'

export interface ReaderOptions {
  cliPath: string | undefined
  pythonBinPath: string | undefined
  cwd: string
}

export type ExecutionOptions = ReaderOptions & {
  command: string
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

export const getExecutionDetails = (
  options: ExecutionOptions
): {
  command: string
  cwd: string
  env: NodeJS.ProcessEnv
} => {
  const { command, cliPath, pythonBinPath } = options
  return {
    env: getEnv(pythonBinPath),
    command: `${cliPath || 'dvc'} ${command}`,
    cwd: options.cwd
  }
}
