import {
  Command,
  ExperimentFlag,
  ExperimentSubCommands,
  Flag,
  ListFlag
} from './args'
import { ExperimentsRepoJSONOutput } from '../Experiments/Webview/contract'
import { ExecutionOptions, CliExecution } from './execution'
import { trimAndSplit } from '../util/stdout'

const { readCliProcess, readCliProcessJson } = CliExecution

export const root = (options: ExecutionOptions): Promise<string> =>
  readCliProcess(options, undefined, Command.ROOT)

export type PathOutput = { path: string }

export type DiffOutput = {
  added?: PathOutput[]
  deleted?: PathOutput[]
  modified?: PathOutput[]
  renamed?: PathOutput[]
  'not in cache'?: PathOutput[]
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

export enum Status {
  DELETED = 'deleted',
  MODIFIED = 'modified',
  NEW = 'new',
  NOT_IN_CACHE = 'not in cache'
}

export enum ChangedType {
  CHANGED_OUTS = 'changed outs',
  CHANGED_DEPS = 'changed deps'
}

export type PathStatus = Record<string, Status>

export type StageOrFileStatuses = Record<ChangedType, PathStatus>

export type StatusesOrAlwaysChanged = StageOrFileStatuses | 'always changed'

export type StatusOutput = Record<string, StatusesOrAlwaysChanged[]>

export const status = (options: ExecutionOptions): Promise<StatusOutput> =>
  readCliProcessJson<StatusOutput>(options, Command.STATUS)

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
