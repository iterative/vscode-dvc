import { join } from 'path'
import { Cli, typeCheckCommands } from '.'
import { Args, Command, Flag, ListFlag, SubCommand } from './constants'
import { retry } from './retry'
import { trim, trimAndSplit } from '../util/stdout'
import { Plot } from '../plots/webview/contract'

export type PathOutput = { path: string }

export type DiffOutput = {
  added?: PathOutput[]
  deleted?: PathOutput[]
  modified?: PathOutput[]
  renamed?: { path: { old: string; new: string } }[]
  'not in cache'?: PathOutput[]
}

export type ListOutput = {
  isdir: boolean
  isexec: boolean
  isout: boolean
  path: string
}

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

export type StageOrFileStatuses = Partial<Record<ChangedType, PathStatus>>

export type StatusesOrAlwaysChanged = StageOrFileStatuses | 'always changed'

export type StatusOutput = Record<string, StatusesOrAlwaysChanged[]>

export type Value = string | number | boolean | null

export interface ValueTreeOrError {
  data?: ValueTree
  error?: { type: string; msg: string }
}

export interface ValueTreeRoot {
  [filename: string]: ValueTreeOrError
}

interface ValueTreeNode {
  [key: string]: Value | ValueTree
}

export type ValueTree = ValueTreeRoot | ValueTreeNode

export interface BaseExperimentFields {
  name?: string
  timestamp?: string | null
  queued?: boolean
  running?: boolean
  executor?: string | null
  checkpoint_tip?: string
  checkpoint_parent?: string
}

interface OutsOrDepsDetails {
  [filename: string]: { hash: string; size: number; nfiles: null | number }
}

export interface ExperimentFields extends BaseExperimentFields {
  params?: ValueTreeRoot
  metrics?: ValueTreeRoot
  deps?: OutsOrDepsDetails
  outs?: OutsOrDepsDetails
}

export interface ExperimentFieldsOrError {
  data?: ExperimentFields
  error?: { type: string; msg: string }
}

export interface ExperimentsBranchOutput {
  [sha: string]: ExperimentFieldsOrError
  baseline: ExperimentFieldsOrError
}

export interface ExperimentsOutput {
  [name: string]: ExperimentsBranchOutput
  workspace: {
    baseline: ExperimentFieldsOrError
  }
}

export interface PlotsOutput {
  [path: string]: Plot[]
}

export const TEMP_PLOTS_DIR = join('.dvc', 'tmp', 'plots')

export const autoRegisteredCommands = {
  DIFF: 'diff',
  EXPERIMENT_SHOW: 'experimentShow',
  LIST_DVC_ONLY_RECURSIVE: 'listDvcOnlyRecursive',
  PLOTS_DIFF: 'plotsDiff',
  STATUS: 'status'
} as const

export class CliReader extends Cli {
  public readonly autoRegisteredCommands = typeCheckCommands(
    autoRegisteredCommands,
    this
  )

  public experimentShow(cwd: string): Promise<ExperimentsOutput> {
    return this.readShowProcessJson<ExperimentsOutput>(cwd, Command.EXPERIMENT)
  }

  public diff(cwd: string): Promise<DiffOutput> {
    return this.readProcessJson<DiffOutput>(cwd, Command.DIFF)
  }

  public listDvcOnlyRecursive(cwd: string): Promise<ListOutput[]> {
    return this.readProcessJson<ListOutput[]>(
      cwd,
      Command.LIST,
      ListFlag.LOCAL_REPO,
      ListFlag.DVC_ONLY,
      Flag.RECURSIVE
    )
  }

  public plotsDiff(cwd: string, ...revisions: string[]): Promise<PlotsOutput> {
    return this.readProcessJson<PlotsOutput>(
      cwd,
      Command.PLOTS,
      'diff',
      ...revisions,
      Flag.OUTPUT_PATH,
      TEMP_PLOTS_DIR,
      Flag.SPLIT
    )
  }

  public async root(cwd: string): Promise<string | undefined> {
    try {
      return await this.executeProcess(cwd, Command.ROOT)
    } catch {}
  }

  public status(cwd: string): Promise<StatusOutput> {
    return this.readProcessJson<StatusOutput>(cwd, Command.STATUS)
  }

  public version(cwd: string): Promise<string> {
    return this.executeProcess(cwd, Flag.VERSION)
  }

  private async readProcess<T = string>(
    cwd: string,
    formatter: typeof trimAndSplit | typeof JSON.parse | typeof trim,
    defaultValue: string,
    ...args: Args
  ): Promise<T> {
    const output =
      (await retry(() => this.executeProcess(cwd, ...args), args.join(' '))) ||
      defaultValue
    if (!formatter) {
      return output as unknown as T
    }
    return formatter(output) as unknown as T
  }

  private readProcessJson<T>(cwd: string, command: Command, ...args: Args) {
    return this.readProcess<T>(
      cwd,
      JSON.parse,
      '{}',
      command,
      ...args,
      Flag.SHOW_JSON
    )
  }

  private readShowProcessJson<T>(
    cwd: string,
    command: Command,
    ...args: Args
  ): Promise<T> {
    return this.readProcessJson<T>(cwd, command, SubCommand.SHOW, ...args)
  }
}
