import { ensureDir } from 'fs-extra'
import { basename, dirname } from 'path'
import { Args, Command, Flag } from './args'
import {
  BaseExecutionOptions,
  ExecutionOptions,
  runCliProcess
} from './execution'

export const checkout = async (options: ExecutionOptions): Promise<string> =>
  runCliProcess(options, Command.CHECKOUT)

export const commit = async (options: ExecutionOptions): Promise<string> =>
  runCliProcess(options, Command.COMMIT, Flag.FORCE)

export const initializeDirectory = async (
  options: ExecutionOptions
): Promise<string> =>
  runCliProcess(options, Command.INITIALIZE, Flag.SUBDIRECTORY)

type TargetExecutionOptions = BaseExecutionOptions & {
  fsPath: string
}

const runTargetCommand = async (
  options: TargetExecutionOptions,
  ...args: Args
): Promise<string> => {
  const { fsPath, cliPath, pythonBinPath } = options

  const cwd = dirname(fsPath)

  const target = basename(fsPath)
  await ensureDir(cwd)

  return runCliProcess({ cwd, cliPath, pythonBinPath }, ...args, target)
}

export const addTarget = async (
  options: TargetExecutionOptions
): Promise<string> => runTargetCommand(options, Command.ADD)

export const checkoutTarget = (
  options: TargetExecutionOptions
): Promise<string> => runTargetCommand(options, Command.CHECKOUT)

export const commitTarget = (
  options: TargetExecutionOptions
): Promise<string> => runTargetCommand(options, Command.COMMIT, Flag.FORCE)

export const pullTarget = async (
  options: TargetExecutionOptions
): Promise<string> => runTargetCommand(options, Command.PULL)

export const pushTarget = async (
  options: TargetExecutionOptions
): Promise<string> => runTargetCommand(options, Command.PUSH)
