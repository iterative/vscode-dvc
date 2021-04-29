import { ensureDir } from 'fs-extra'
import { basename, dirname } from 'path'
import {
  Args,
  Command,
  ExperimentFlag,
  ExperimentSubCommands,
  Flag,
  GcPreserveFlag
} from './args'
import {
  BaseExecutionOptions,
  ExecutionOptions,
  executeCliProcess
} from './execution'

export const checkout = (options: ExecutionOptions): Promise<string> =>
  executeCliProcess(options, Command.CHECKOUT)

export const commit = (options: ExecutionOptions): Promise<string> =>
  executeCliProcess(options, Command.COMMIT, Flag.FORCE)

export const experimentApply = (
  options: ExecutionOptions,
  experiment: string
): Promise<string> =>
  executeCliProcess(
    options,
    Command.EXPERIMENT,
    ExperimentSubCommands.APPLY,
    experiment
  )

export const experimentBranch = (
  options: ExecutionOptions,
  experiment: string,
  branchName: string
): Promise<string> =>
  executeCliProcess(
    options,
    Command.EXPERIMENT,
    ExperimentSubCommands.BRANCH,
    experiment,
    branchName
  )

export const experimentGarbageCollect = (
  options: ExecutionOptions,
  preserveFlags: GcPreserveFlag[]
): Promise<string> =>
  executeCliProcess(
    options,
    Command.EXPERIMENT,
    ExperimentSubCommands.GARBAGE_COLLECT,
    Flag.FORCE,
    ExperimentFlag.WORKSPACE,
    ...preserveFlags
  )

export const experimentRemove = (
  options: ExecutionOptions,
  experiment: string
): Promise<string> =>
  executeCliProcess(
    options,
    Command.EXPERIMENT,
    ExperimentSubCommands.REMOVE,
    experiment
  )

export const initializeDirectory = (
  options: ExecutionOptions
): Promise<string> =>
  executeCliProcess(options, Command.INITIALIZE, Flag.SUBDIRECTORY)

export const queueExperiment = (options: ExecutionOptions): Promise<string> =>
  executeCliProcess(
    options,
    Command.EXPERIMENT,
    ExperimentSubCommands.RUN,
    ExperimentFlag.QUEUE
  )

type ExecutionOnTargetOptions = BaseExecutionOptions & {
  fsPath: string
}

const runCliProcessOnTarget = async (
  options: ExecutionOnTargetOptions,
  ...args: Args
): Promise<string> => {
  const { fsPath, cliPath, pythonBinPath } = options

  const cwd = dirname(fsPath)

  const target = basename(fsPath)
  await ensureDir(cwd)

  return executeCliProcess({ cwd, cliPath, pythonBinPath }, ...args, target)
}

export const addTarget = (options: ExecutionOnTargetOptions): Promise<string> =>
  runCliProcessOnTarget(options, Command.ADD)

export const checkoutTarget = (
  options: ExecutionOnTargetOptions
): Promise<string> => runCliProcessOnTarget(options, Command.CHECKOUT)

export const commitTarget = (
  options: ExecutionOnTargetOptions
): Promise<string> => runCliProcessOnTarget(options, Command.COMMIT, Flag.FORCE)

export const pullTarget = (
  options: ExecutionOnTargetOptions
): Promise<string> => runCliProcessOnTarget(options, Command.PULL)

export const pushTarget = (
  options: ExecutionOnTargetOptions
): Promise<string> => runCliProcessOnTarget(options, Command.PUSH)
