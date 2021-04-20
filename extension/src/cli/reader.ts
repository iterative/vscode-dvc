import { Commands, GcPreserveFlag } from './commands'
import { execPromise, trimAndSplit } from '../util'
import { ExperimentsRepoJSONOutput } from '../webviews/experiments/contract'
import { getExecutionDetails, ReaderOptions } from './executionDetails'

export const executeProcess = async (
  options: ReaderOptions,
  partialCommand: Commands
): Promise<string> => {
  const { command, cwd, env } = getExecutionDetails({
    ...options,
    command: partialCommand
  })
  const { stdout } = await execPromise(command, {
    cwd,
    env
  })
  return stdout
}

const executeWithTrimAndSplit = async (
  options: ReaderOptions,
  command: Commands
): Promise<string[]> => {
  const stdout = await executeProcess(options, command)
  return trimAndSplit(stdout)
}

const executeAndParseJson = async <T>(
  options: ReaderOptions,
  command: Commands
): Promise<T> => {
  const stdout = await executeProcess(options, command)
  return JSON.parse(stdout)
}

const executeAndTrim = async (
  options: ReaderOptions,
  command: Commands
): Promise<string> => {
  const stdout = await executeProcess(options, command)
  return stdout.trim()
}

export const checkout = async (options: ReaderOptions): Promise<string> =>
  executeProcess(options, Commands.CHECKOUT)

export const checkoutRecursive = async (
  options: ReaderOptions
): Promise<string> => executeProcess(options, Commands.CHECKOUT_RECURSIVE)

export const getRoot = async (options: ReaderOptions): Promise<string> =>
  executeAndTrim(options, Commands.ROOT)

export const getExperiments = async (
  options: ReaderOptions
): Promise<ExperimentsRepoJSONOutput> =>
  executeAndParseJson<ExperimentsRepoJSONOutput>(
    options,
    Commands.EXPERIMENT_SHOW
  )

export const initializeDirectory = async (
  options: ReaderOptions
): Promise<string> => executeProcess(options, Commands.INITIALIZE_SUBDIRECTORY)

export const listDvcOnlyRecursive = async (
  options: ReaderOptions
): Promise<string[]> =>
  executeWithTrimAndSplit(options, Commands.LIST_DVC_ONLY_RECURSIVE)

type Status = Record<
  string,
  (Record<string, Record<string, string>> | string)[]
>

export const status = async (options: ReaderOptions): Promise<Status> =>
  executeAndParseJson<Status>(options, Commands.STATUS)

export const queueExperiment = async (
  options: ReaderOptions
): Promise<string> => executeProcess(options, Commands.EXPERIMENT_QUEUE)

export const experimentGarbageCollect = async (
  options: ReaderOptions,
  preserveFlags: GcPreserveFlag[]
): Promise<string> =>
  executeProcess(
    options,
    [Commands.EXPERIMENT_GC, ...preserveFlags].join(' ') as Commands
  )
