import {
  buildArgs,
  Commands,
  CommitFlag,
  ExperimentSubCommands,
  Flags,
  GcPreserveFlag,
  ListFlag
} from './commands'
import { trimAndSplit } from '../util/stdout'
import { ExperimentsRepoJSONOutput } from '../webviews/experiments/contract'
import { execProcess, ReaderOptions } from './execution'

export const checkout = async (options: ReaderOptions): Promise<string[]> =>
  execProcess<string[]>(options, [Commands.CHECKOUT], trimAndSplit)

export const commit = async (options: ReaderOptions): Promise<string> =>
  execProcess<string>(options, buildArgs(Commands.COMMIT, CommitFlag.FORCE))

export const getRoot = async (options: ReaderOptions): Promise<string> =>
  execProcess<string>(options, [Commands.ROOT])

export const getExperiments = async (
  options: ReaderOptions
): Promise<ExperimentsRepoJSONOutput> =>
  execProcess<ExperimentsRepoJSONOutput>(
    options,
    [Commands.EXPERIMENT_SHOW],
    JSON.parse
  )

export const initializeDirectory = async (
  options: ReaderOptions
): Promise<string> =>
  execProcess<string>(options, [Commands.INITIALIZE_SUBDIRECTORY])

export const listDvcOnly = async (
  options: ReaderOptions,
  relativePath: string
): Promise<string[]> =>
  execProcess<string[]>(
    options,
    buildArgs(Commands.LIST, relativePath, ListFlag.DVC_ONLY),
    trimAndSplit
  )

export const listDvcOnlyRecursive = async (
  options: ReaderOptions
): Promise<string[]> =>
  execProcess<string[]>(
    options,
    buildArgs(Commands.LIST, ListFlag.DVC_ONLY, ListFlag.RECURSIVE),
    trimAndSplit
  )

type Status = Record<
  string,
  (Record<string, Record<string, string>> | string)[]
>

export const status = async (options: ReaderOptions): Promise<Status> =>
  execProcess<Status>(options, [Commands.STATUS], JSON.parse)

export const queueExperiment = async (
  options: ReaderOptions
): Promise<string> => execProcess<string>(options, [Commands.EXPERIMENT_QUEUE])

export const experimentListCurrent = async (
  readerOptions: ReaderOptions
): Promise<string[]> =>
  trimAndSplit(
    await execProcess(
      readerOptions,
      buildArgs(
        Commands.EXPERIMENT,
        ExperimentSubCommands.LIST,
        Flags.NAMES_ONLY
      )
    )
  )

export const experimentGarbageCollect = async (
  options: ReaderOptions,
  preserveFlags: GcPreserveFlag[]
): Promise<string> =>
  execProcess(options, buildArgs(Commands.EXPERIMENT_GC, ...preserveFlags))

export const experimentApply = async (
  options: ReaderOptions,
  experiment: string
): Promise<string> =>
  execProcess(
    options,
    buildArgs(Commands.EXPERIMENT, ExperimentSubCommands.APPLY, experiment)
  )

export const experimentRemove = async (
  options: ReaderOptions,
  experiment: string
): Promise<void> =>
  execProcess(options, buildArgs(Commands.EXPERIMENT_REMOVE, experiment))

export const experimentBranch = async (
  options: ReaderOptions,
  experiment: string,
  branchName: string
): Promise<string> =>
  execProcess(
    options,
    buildArgs(Commands.EXPERIMENT_BRANCH, experiment, branchName)
  )
