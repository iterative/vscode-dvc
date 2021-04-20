import { Commands, GcPreserveFlag } from './commands'
import { execPromise, trimAndSplit } from '../util'
import { ExperimentsRepoJSONOutput } from '../webviews/experiments/contract'
import { ExecutionOptions, getExecutionDetails } from './executionDetails'

export const executeProcess = async (
  options: ExecutionOptions,
  command: Commands
): Promise<string> => {
  const executionDetails = getExecutionDetails(options, command)
  const { stdout } = await execPromise(executionDetails.command, {
    cwd: options.cwd,
    env: executionDetails.env
  })
  return stdout
}

const executeWithTrimAndSplit = async (
  options: ExecutionOptions,
  command: Commands
): Promise<string[]> => {
  const stdout = await executeProcess(options, command)
  return trimAndSplit(stdout)
}

const executeAndParseJson = async <T>(
  options: ExecutionOptions,
  command: Commands
): Promise<T> => {
  const stdout = await executeProcess(options, command)
  return JSON.parse(stdout)
}

const executeAndTrim = async (
  options: ExecutionOptions,
  command: Commands
): Promise<string> => {
  const stdout = await executeProcess(options, command)
  return stdout.trim()
}

export const checkout = async (options: ExecutionOptions): Promise<string> =>
  executeProcess(options, Commands.CHECKOUT)

export const checkoutRecursive = async (
  options: ExecutionOptions
): Promise<string> => executeProcess(options, Commands.CHECKOUT_RECURSIVE)

export const getRoot = async (options: ExecutionOptions): Promise<string> =>
  executeAndTrim(options, Commands.ROOT)

export const getExperiments = async (
  options: ExecutionOptions
): Promise<ExperimentsRepoJSONOutput> =>
  executeAndParseJson<ExperimentsRepoJSONOutput>(
    options,
    Commands.EXPERIMENT_SHOW
  )

export const initializeDirectory = async (
  options: ExecutionOptions
): Promise<string> => executeProcess(options, Commands.INITIALIZE_SUBDIRECTORY)

export const listDvcOnlyRecursive = async (
  options: ExecutionOptions
): Promise<string[]> =>
  executeWithTrimAndSplit(options, Commands.LIST_DVC_ONLY_RECURSIVE)

type Status = Record<
  string,
  (Record<string, Record<string, string>> | string)[]
>

export const status = async (options: ExecutionOptions): Promise<Status> =>
  executeAndParseJson<Status>(options, Commands.STATUS)

export const queueExperiment = async (
  options: ExecutionOptions
): Promise<string> => executeProcess(options, Commands.EXPERIMENT_QUEUE)

export const experimentGarbageCollect = async (
  options: ExecutionOptions,
  preserveFlags: GcPreserveFlag[]
): Promise<string> =>
  executeProcess(
    options,
    [Commands.EXPERIMENT_GC, ...preserveFlags].join(' ') as Commands
  )
