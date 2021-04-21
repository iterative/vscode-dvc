import {
  Commands,
  GcPreserveFlag,
  getListCommand,
  getListCommand_HR
} from './commands'
import { execPromise } from '../util'
import { trim, trimAndSplit } from '../util/stdout'
import { ExperimentsRepoJSONOutput } from '../webviews/experiments/contract'
import { getExecutionDetails, ReaderOptions } from './executionDetails'

export const executeProcess = async <T>(
  options: ReaderOptions,
  partialCommand: Commands,
  formatter: typeof trimAndSplit | typeof trim | typeof JSON.parse = trim
): Promise<T> => {
  const { command, cwd, env } = getExecutionDetails({
    ...options,
    command: partialCommand
  })
  const { stdout } = await execPromise(command, {
    cwd,
    env
  })
  return (formatter(stdout) as unknown) as T
}

export const checkout = async (options: ReaderOptions): Promise<string[]> =>
  executeProcess<string[]>(options, Commands.CHECKOUT, trimAndSplit)

export const checkoutRecursive = async (
  options: ReaderOptions
): Promise<string[]> =>
  executeProcess<string[]>(options, Commands.CHECKOUT_RECURSIVE, trimAndSplit)

export const getRoot = async (options: ReaderOptions): Promise<string> =>
  executeProcess<string>(options, Commands.ROOT)

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

export const listDvcOnly = async (
  options: ReaderOptions,
  relativePath: string
): Promise<string[]> =>
  executeProcess<string[]>(options, getListCommand(relativePath), trimAndSplit)

export const listDvcOnly_HackedRemote = async (
  options: ReaderOptions,
  relativePath: string
): Promise<string[]> =>
  executeProcess<string[]>(
    options,
    getListCommand_HR(relativePath),
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
