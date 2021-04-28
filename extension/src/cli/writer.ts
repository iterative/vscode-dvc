import { ensureDir } from 'fs-extra'
import { basename, dirname } from 'path'
import { Args, Command, Flag } from './args'
import { ExecutionOptions, runCliProcess } from './execution'

export const checkout = async (options: ExecutionOptions): Promise<string> =>
  runCliProcess(options, Command.CHECKOUT)

export const commit = async (options: ExecutionOptions): Promise<string> =>
  runCliProcess(options, Command.COMMIT, Flag.FORCE)

export const initializeDirectory = async (
  options: ExecutionOptions
): Promise<string> =>
  runCliProcess(options, Command.INITIALIZE, Flag.SUBDIRECTORY)

const runTargetCommand = async (
  options: {
    fsPath: string
    cliPath: string | undefined
    pythonBinPath: string | undefined
  },
  ...args: Args
): Promise<string> => {
  const { fsPath, cliPath, pythonBinPath } = options

  const cwd = dirname(fsPath)

  const target = basename(fsPath)
  await ensureDir(cwd)

  return runCliProcess({ cwd, cliPath, pythonBinPath }, ...args, target)
}

export const pullTarget = async (options: {
  fsPath: string
  cliPath: string | undefined
  pythonBinPath: string | undefined
}): Promise<string> => runTargetCommand(options, Command.PULL)

export const pushTarget = async (options: {
  fsPath: string
  cliPath: string | undefined
  pythonBinPath: string | undefined
}): Promise<string> => runTargetCommand(options, Command.PUSH)
