import { Args } from './args'

export const getArgs = (
  pythonBinPath: string | undefined,
  cliPath: string,
  ...args: Args
) => (!cliPath && pythonBinPath ? ['-m', 'dvc', ...args] : args)

export const getExecutable = (
  pythonBinPath: string | undefined,
  cliPath: string
) => cliPath || pythonBinPath || 'dvc'
