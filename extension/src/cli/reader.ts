import {
  Commands,
  ExperimentFlag,
  ExperimentSubCommands,
  Flag,
  GcPreserveFlag,
  ListFlag,
  Target
} from './commands'
import { ExperimentsRepoJSONOutput } from '../webviews/experiments/contract'
import {
  execProcess,
  execProcessJson,
  execProcessSplit,
  ExecutionOptions
} from './execution'

export const checkout = async (options: ExecutionOptions): Promise<string[]> =>
  execProcessSplit(options, Commands.CHECKOUT)

export const commit = async (options: ExecutionOptions): Promise<string> =>
  execProcess(options, Commands.COMMIT, Flag.FORCE)

export const getRoot = async (options: ExecutionOptions): Promise<string> =>
  execProcess(options, Commands.ROOT)

export const getExperiments = async (
  options: ExecutionOptions
): Promise<ExperimentsRepoJSONOutput> =>
  execProcessJson<ExperimentsRepoJSONOutput>(options, Commands.EXPERIMENT_SHOW)

export const initializeDirectory = async (
  options: ExecutionOptions
): Promise<string> => execProcess(options, Commands.INITIALIZE_SUBDIRECTORY)

export const listDvcOnly = async (
  options: ExecutionOptions,
  relativePath: string
): Promise<string[]> =>
  execProcessSplit(
    options,
    Commands.LIST,
    relativePath as Target,
    ListFlag.DVC_ONLY
  )

export const listDvcOnlyRecursive = async (
  options: ExecutionOptions
): Promise<string[]> =>
  execProcessSplit(options, Commands.LIST, ListFlag.DVC_ONLY, Flag.RECURSIVE)

type Status = Record<
  string,
  (Record<string, Record<string, string>> | string)[]
>

export const status = async (options: ExecutionOptions): Promise<Status> =>
  execProcessJson<Status>(options, Commands.STATUS)

export const queueExperiment = async (
  options: ExecutionOptions
): Promise<string> => execProcess(options, Commands.EXPERIMENT_QUEUE)

export const experimentListCurrent = async (
  options: ExecutionOptions
): Promise<string[]> =>
  execProcessSplit(
    options,
    Commands.EXPERIMENT,
    ExperimentSubCommands.LIST,
    ExperimentFlag.NAMES_ONLY
  )

export const experimentGarbageCollect = async (
  options: ExecutionOptions,
  preserveFlags: GcPreserveFlag[]
): Promise<string> =>
  execProcess(options, Commands.EXPERIMENT_GC, ...preserveFlags)

export const experimentApply = async (
  options: ExecutionOptions,
  experiment: string
): Promise<string> =>
  execProcess(
    options,
    Commands.EXPERIMENT,
    ExperimentSubCommands.APPLY,
    experiment
  )

export const experimentRemove = async (
  options: ExecutionOptions,
  experiment: string
): Promise<string> =>
  execProcess(options, Commands.EXPERIMENT_REMOVE, experiment as Target)

export const experimentBranch = async (
  options: ExecutionOptions,
  experiment: string,
  branchName: string
): Promise<string> =>
  execProcess(options, Commands.EXPERIMENT_BRANCH, experiment, branchName)
