import {
  Command,
  ExperimentFlag,
  ExperimentSubCommands,
  Flag,
  ListFlag
} from './args'
import { ExperimentsRepoJSONOutput } from '../Experiments/Webview/contract'
import {
  ExecutionOptions,
  readCliProcess,
  readCliProcessJson
} from './execution'
import { trimAndSplit } from '../util/stdout'

export const root = (options: ExecutionOptions): Promise<string> =>
  readCliProcess(options, undefined, Command.ROOT)

type Path = { path: string }

export type DiffOutput = {
  added?: Path[]
  deleted?: Path[]
  modified?: Path[]
  renamed?: Path[]
  'not in cache'?: Path[]
}

export const diff = (options: ExecutionOptions): Promise<DiffOutput> =>
  readCliProcessJson<DiffOutput>(options, Command.DIFF)

export const experimentShow = (
  options: ExecutionOptions
): Promise<ExperimentsRepoJSONOutput> =>
  readCliProcessJson<ExperimentsRepoJSONOutput>(
    options,
    Command.EXPERIMENT,
    ExperimentSubCommands.SHOW
  )

export type ListOutput = {
  isdir: boolean
  isexec: boolean
  isout: boolean
  path: string
}

export const listDvcOnly = (
  options: ExecutionOptions,
  relativePath: string
): Promise<ListOutput[]> =>
  readCliProcessJson<ListOutput[]>(
    options,
    Command.LIST,
    ListFlag.LOCAL_REPO,
    relativePath,
    ListFlag.DVC_ONLY
  )

export const listDvcOnlyRecursive = (
  options: ExecutionOptions
): Promise<ListOutput[]> =>
  readCliProcessJson<ListOutput[]>(
    options,
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
  readCliProcessJson<Status>(options, Command.STATUS)

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
