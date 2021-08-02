import { Args } from './args'

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
): { args: Args; command: string; cwd: string; executable: string } => {
  const executable = getExecutable(pythonBinPath, cliPath)
  const args = getArgs(pythonBinPath, cliPath, ...originalArgs)
  const command = [executable, ...args].join(' ')
  return {
    args,
    command,
    cwd,
    executable
  }
}
