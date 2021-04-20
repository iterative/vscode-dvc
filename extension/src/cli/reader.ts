import { Commands, GcPreserveFlag } from './commands'
import { execPromise, trim, trimAndSplit } from '../util'
import { ExperimentsRepoJSONOutput } from '../webviews/experiments/contract'
import { getExecutionDetails, ReaderOptions } from './executionDetails'

export const executeProcess = async <T>(
  options: ReaderOptions,
  partialCommand: Commands,
  formatter?: typeof trimAndSplit | typeof trim | typeof JSON.parse
): Promise<T> => {
  const { command, cwd, env } = getExecutionDetails({
    ...options,
    command: partialCommand
  })
  const { stdout } = await execPromise(command, {
    cwd,
    env
  })
  return ((formatter ? formatter(stdout) : stdout) as unknown) as T
}

export const checkout = async (options: ReaderOptions): Promise<string> =>
  executeProcess<string>(options, Commands.CHECKOUT)

export const checkoutRecursive = async (
  options: ReaderOptions
): Promise<string> =>
  executeProcess<string>(options, Commands.CHECKOUT_RECURSIVE)

export const getRoot = async (options: ReaderOptions): Promise<string> =>
  executeProcess<string>(options, Commands.ROOT, trim)

export const getExperiments = async (
  options: ReaderOptions
): Promise<ExperimentsRepoJSONOutput> =>
  executeProcess<ExperimentsRepoJSONOutput>(
    options,
    Commands.EXPERIMENT_SHOW,
    JSON.parse
  )

export const initializeDirectory = async (
  options: ReaderOptions
): Promise<string> =>
  executeProcess<string>(options, Commands.INITIALIZE_SUBDIRECTORY)

export const listDvcOnlyRecursive = async (
  options: ReaderOptions
): Promise<string[]> =>
  executeProcess<string[]>(
    options,
    Commands.LIST_DVC_ONLY_RECURSIVE,
    trimAndSplit
  )

type Status = Record<
  string,
  (Record<string, Record<string, string>> | string)[]
>

export const status = async (options: ReaderOptions): Promise<Status> =>
  executeProcess<Status>(options, Commands.STATUS, JSON.parse)

export const queueExperiment = async (
  options: ReaderOptions
): Promise<string> => executeProcess<string>(options, Commands.EXPERIMENT_QUEUE)

export const experimentGarbageCollect = async (
  options: ReaderOptions,
  preserveFlags: GcPreserveFlag[]
): Promise<string> =>
  executeProcess<string>(
    options,
    [Commands.EXPERIMENT_GC, ...preserveFlags].join(' ') as Commands
  )
