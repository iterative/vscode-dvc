import { dirname } from 'path'
import { Args } from './constants'
import { getCaseSensitiveCwd } from './cwd'
import { getProcessEnv } from '../../env'
import { joinEnvPath } from '../../util/env'
import { ProcessOptions } from '../../process/execution'

type ExecutionOptions = ProcessOptions & {
  env: NodeJS.ProcessEnv
}

const getPATH = (existingPath: string, pythonBinPath?: string): string => {
  const python = pythonBinPath ? dirname(pythonBinPath) : ''
  return joinEnvPath(python, existingPath)
}

const getEnv = (
  pythonBinPath: string | undefined,
  PYTHONPATH: string | undefined
): NodeJS.ProcessEnv => {
  const existingEnv = getProcessEnv()
  const PATH = getPATH(existingEnv?.PATH as string, pythonBinPath)
  const env: NodeJS.ProcessEnv = {
    ...existingEnv,
    DVCLIVE_OPEN: 'false',
    DVC_NO_ANALYTICS: 'true',
    GIT_TERMINAL_PROMPT: '0',
    PATH
  }
  if (PYTHONPATH) {
    env.PYTHONPATH = PYTHONPATH
  }
  return env
}

const getArgs = (
  pythonBinPath: string | undefined,
  cliPath: string,
  ...args: Args
) => (!cliPath && pythonBinPath ? ['-m', 'dvc', ...args] : args)

const getExecutable = (pythonBinPath: string | undefined, cliPath: string) =>
  cliPath || pythonBinPath || 'dvc'

export const getOptions = ({
  args = [],
  cliPath,
  cwd,
  pythonBinPath,
  PYTHONPATH
}: {
  args?: Args
  cliPath: string
  cwd: string
  pythonBinPath: string | undefined
  PYTHONPATH: string | undefined
}): ExecutionOptions => {
  const executable = getExecutable(pythonBinPath, cliPath)
  return {
    args: getArgs(pythonBinPath, cliPath, ...args),
    cwd: getCaseSensitiveCwd(cwd),
    env: getEnv(pythonBinPath, PYTHONPATH),
    executable
  }
}
