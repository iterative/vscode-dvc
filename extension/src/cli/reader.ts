import {
  Command,
  ExperimentFlag,
  ExperimentSubCommands,
  Flag,
  ListFlag
} from './args'
import { ExperimentsRepoJSONOutput } from '../webviews/experiments/contract'
import { ExecutionOptions, readCliProcess } from './execution'
import { trimAndSplit } from '../util/stdout'

export const root = (options: ExecutionOptions): Promise<string> =>
  readCliProcess(options, undefined, Command.ROOT)

export const experimentShow = (
  options: ExecutionOptions
): Promise<ExperimentsRepoJSONOutput> =>
  readCliProcess<ExperimentsRepoJSONOutput>(
    options,
    JSON.parse,
    Command.EXPERIMENT,
    ExperimentSubCommands.SHOW,
    Flag.SHOW_JSON
  )

export const listDvcOnly = (
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

export const listDvcOnlyRecursive = (
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

export const status = (options: ExecutionOptions): Promise<Status> =>
  readCliProcess<Status>(options, JSON.parse, Command.STATUS, Flag.SHOW_JSON)

export const experimentListCurrent = (
  options: ExecutionOptions
): Promise<string[]> =>
  readCliProcess<string[]>(
    options,
    trimAndSplit,
    Command.EXPERIMENT,
    ExperimentSubCommands.LIST,
    ExperimentFlag.NAMES_ONLY
  )
