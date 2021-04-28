import {
  Command,
  ExperimentFlag,
  ExperimentSubCommands,
  Flag,
  ListFlag
} from './args'
import { ExperimentsRepoJSONOutput } from '../webviews/experiments/contract'
import { ExecutionOptions, readCliProcess, runCliProcess } from './execution'
import { trimAndSplit } from '../util/stdout'

export const root = async (options: ExecutionOptions): Promise<string> =>
  runCliProcess(options, Command.ROOT)

export const getExperiments = async (
  options: ExecutionOptions
): Promise<ExperimentsRepoJSONOutput> =>
  readCliProcess<ExperimentsRepoJSONOutput>(
    options,
    JSON.parse,
    Command.EXPERIMENT,
    ExperimentSubCommands.SHOW,
    Flag.SHOW_JSON
  )

export const listDvcOnly = async (
  options: ExecutionOptions,
  relativePath: string
): Promise<string[]> =>
  readCliProcess<string[]>(
    options,
    trimAndSplit,
    Command.LIST,
    ListFlag.LOCAL_REPO,
    relativePath,
    ListFlag.DVC_ONLY
  )

export const listDvcOnlyRecursive = async (
  options: ExecutionOptions
): Promise<string[]> =>
  readCliProcess<string[]>(
    options,
    trimAndSplit,
    Command.LIST,
    ListFlag.LOCAL_REPO,
    ListFlag.DVC_ONLY,
    Flag.RECURSIVE
  )

type Status = Record<
  string,
  (Record<string, Record<string, string>> | string)[]
>

export const status = async (options: ExecutionOptions): Promise<Status> =>
  readCliProcess<Status>(options, JSON.parse, Command.STATUS, Flag.SHOW_JSON)

export const experimentListCurrent = async (
  options: ExecutionOptions
): Promise<string[]> =>
  readCliProcess<string[]>(
    options,
    trimAndSplit,
    Command.EXPERIMENT,
    ExperimentSubCommands.LIST,
    ExperimentFlag.NAMES_ONLY
  )

export const experimentRemove = async (
  options: ExecutionOptions,
  experiment: string
): Promise<string> =>
  runCliProcess(
    options,
    Command.EXPERIMENT,
    ExperimentSubCommands.REMOVE,
    experiment
  )

export const experimentBranch = async (
  options: ExecutionOptions,
  experiment: string,
  branchName: string
): Promise<string> =>
  runCliProcess(
    options,
    Command.EXPERIMENT,
    ExperimentSubCommands.BRANCH,
    experiment,
    branchName
  )
