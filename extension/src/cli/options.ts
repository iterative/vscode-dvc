import { delimiter, dirname } from 'path'
import { Args } from './args'
import { getProcessEnv } from '../env'
import { joinTruthyItems } from '../util/array'

const getPATH = (existingPath: string, pythonBinPath?: string): string => {
  const python = pythonBinPath ? dirname(pythonBinPath) : ''
  return joinTruthyItems([python, existingPath], delimiter)
}

const getEnv = (pythonBinPath?: string): NodeJS.ProcessEnv => {
  const env = getProcessEnv()
  const PATH = getPATH(env?.PATH as string, pythonBinPath)
  return {
    ...env,
    PATH
  }
}

const getArgs = (
  pythonBinPath: string | undefined,
  cliPath: string,
  ...args: Args
) => (!cliPath && pythonBinPath ? ['-m', 'dvc', ...args] : args)

const getExecutable = (pythonBinPath: string | undefined, cliPath: string) =>
  cliPath || pythonBinPath || 'dvc'

export const getOptions = (
  pythonBinPath: string | undefined,
  cliPath: string,
  cwd: string,
  ...originalArgs: Args
): {
  args: Args
  command: string
  cwd: string
  env: NodeJS.ProcessEnv
  executable: string
} => {
  const executable = getExecutable(pythonBinPath, cliPath)
  const args = getArgs(pythonBinPath, cliPath, ...originalArgs)
  const command = [executable, ...args].join(' ')
  const env = getEnv(pythonBinPath)
  return {
    args,
    command,
    cwd,
    env,
    executable
  }
}
