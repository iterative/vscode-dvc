import { join } from 'path'
import { Cli, typeCheckCommands } from '.'
import { Args, Command, ExperimentFlag, Flag, SubCommand } from './constants'
import { retry } from './retry'
import { trim, trimAndSplit } from '../util/stdout'
import { Plot } from '../plots/webview/contract'

export type DataStatusOutput = {
  committed?: {
    added?: string[]
    deleted?: string[]
    modified?: string[]
    renamed?: { new: string; old: string }[]
  }
  not_in_cache?: string[]
  unchanged?: string[]
  uncommitted?: {
    added?: string[]
    deleted?: string[]
    modified?: string[]
    renamed?: { new: string; old: string }[]
  }
}

type SingleValue = string | number | boolean | null
export type Value = SingleValue | SingleValue[]

export interface ValueTreeOrError {
  data?: ValueTree
  error?: { type: string; msg: string }
}

type RelPathObject<T> = {
  [relPath: string]: T
}

export type ValueTreeRoot = RelPathObject<ValueTreeOrError>

export interface ValueTreeNode {
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

type Dep = { hash: string; size: number; nfiles: null | number }
type Out = Dep & { use_cache: boolean; is_data_source: boolean }

export type Deps = RelPathObject<Dep>

export interface ExperimentFields extends BaseExperimentFields {
  params?: ValueTreeRoot
  metrics?: ValueTreeRoot
  deps?: Deps
  outs?: RelPathObject<Out>
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
  DATA_STATUS: 'dataStatus',
  EXP_SHOW: 'expShow',
  PLOTS_DIFF: 'plotsDiff'
} as const

export class CliReader extends Cli {
  public readonly autoRegisteredCommands = typeCheckCommands(
    autoRegisteredCommands,
    this
  )

  public dataStatus(cwd: string, ...args: Args) {
    return this.readProcessJson<DataStatusOutput>(
      cwd,
      Command.DATA,
      SubCommand.STATUS,
      Flag.WITH_DIRS,
      Flag.GRANULAR,
      ...args
    )
  }

  public expShow(
    cwd: string,
    ...flags: ExperimentFlag[]
  ): Promise<ExperimentsOutput> {
    return this.readProcessJson<ExperimentsOutput>(
      cwd,
      Command.EXPERIMENT,
      SubCommand.SHOW,
      ...flags
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
}
