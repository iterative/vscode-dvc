import { buildCommand, Commands, GcPreserveFlag } from './commands'
import { trimAndSplit } from '../util/stdout'
import { ExperimentsRepoJSONOutput } from '../webviews/experiments/contract'
import { executeBlocking, ReaderOptions } from './execution'

export const checkout = async (options: ReaderOptions): Promise<string[]> =>
  executeBlocking<string[]>(options, Commands.CHECKOUT, trimAndSplit)

export const checkoutRecursive = async (
  options: ReaderOptions
): Promise<string[]> =>
  executeBlocking<string[]>(options, Commands.CHECKOUT_RECURSIVE, trimAndSplit)

export const getRoot = async (options: ReaderOptions): Promise<string> =>
  executeBlocking<string>(options, Commands.ROOT)

export const getExperiments = async (
  options: ReaderOptions
): Promise<ExperimentsRepoJSONOutput> =>
  executeBlocking<ExperimentsRepoJSONOutput>(
    options,
    Commands.EXPERIMENT_SHOW,
    JSON.parse
  )

export const initializeDirectory = async (
  options: ReaderOptions
): Promise<string> =>
  executeBlocking<string>(options, Commands.INITIALIZE_SUBDIRECTORY)

export const listDvcOnlyRecursive = async (
  options: ReaderOptions
): Promise<string[]> =>
  executeBlocking<string[]>(
    options,
    Commands.LIST_DVC_ONLY_RECURSIVE,
    trimAndSplit
  )

type Status = Record<
  string,
  (Record<string, Record<string, string>> | string)[]
>

export const status = async (options: ReaderOptions): Promise<Status> =>
  executeBlocking<Status>(options, Commands.STATUS, JSON.parse)

export const queueExperiment = async (
  options: ReaderOptions
): Promise<string> =>
  executeBlocking<string>(options, Commands.EXPERIMENT_QUEUE)

export const experimentListCurrent = async (
  readerOptions: ReaderOptions
): Promise<string[]> =>
  trimAndSplit(
    await executeBlocking(readerOptions, Commands.EXPERIMENT_LIST_NAMES_ONLY)
  )

export const experimentGarbageCollect = async (
  options: ReaderOptions,
  preserveFlags: GcPreserveFlag[]
): Promise<string> =>
  executeBlocking(
    options,
    buildCommand(Commands.EXPERIMENT_GC, ...preserveFlags)
  )

export const experimentApply = async (
  options: ReaderOptions,
  experiment: string
): Promise<string> =>
  executeBlocking(options, buildCommand(Commands.EXPERIMENT_APPLY, experiment))

export const experimentRemove = async (
  options: ReaderOptions,
  experiment: string
): Promise<void> =>
  executeBlocking(options, buildCommand(Commands.EXPERIMENT_REMOVE, experiment))

export const experimentBranch = async (
  options: ReaderOptions,
  experiment: string,
  branchName: string
): Promise<string> =>
  executeBlocking(
    options,
    buildCommand(Commands.EXPERIMENT_BRANCH, experiment, branchName)
  )
