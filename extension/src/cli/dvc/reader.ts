import { join } from 'path'
import { DvcCli } from '.'
import { Args, Command, ExperimentFlag, Flag, SubCommand } from './constants'
import { typeCheckCommands } from '..'
import { MaybeConsoleError } from '../error'
import { Plot } from '../../plots/webview/contract'
import { Logger } from '../../common/logger'
import isEmpty from 'lodash.isempty'

export type DvcError = { error: { type: string; msg: string } }

export type Changes = {
  added?: string[]
  deleted?: string[]
  modified?: string[]
  renamed?: { new: string; old: string }[]
  unknown?: string[]
}

export type DataStatusOutput = {
  committed?: Changes
  not_in_cache?: string[]
  unchanged?: string[]
  uncommitted?: Changes
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

type Dep = { hash: null | string; size: null | number; nfiles: null | number }
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

const defaultExperimentsOutput: ExperimentsOutput = {
  workspace: { baseline: {} }
}

export interface PlotsOutput {
  [path: string]: Plot[]
}

export const TEMP_PLOTS_DIR = join('.dvc', 'tmp', 'plots')

export const isDvcError = <
  T extends ExperimentsOutput | DataStatusOutput | PlotsOutput
>(
  dataOrError: T | DvcError
): dataOrError is DvcError => !!(dataOrError as DvcError).error

export const autoRegisteredCommands = {
  DATA_STATUS: 'dataStatus',
  EXP_SHOW: 'expShow',
  PLOTS_DIFF: 'plotsDiff'
} as const

export class DvcReader extends DvcCli {
  public readonly autoRegisteredCommands = typeCheckCommands(
    autoRegisteredCommands,
    this
  )

  public dataStatus(
    cwd: string,
    ...args: Args
  ): Promise<DataStatusOutput | DvcError> {
    return this.readProcessJson<DataStatusOutput>(
      cwd,
      Command.DATA,
      SubCommand.STATUS,
      Flag.GRANULAR,
      Flag.UNCHANGED,
      ...args
    )
  }

  public async expShow(
    cwd: string,
    ...flags: ExperimentFlag[]
  ): Promise<ExperimentsOutput> {
    const output = await this.readProcess<ExperimentsOutput>(
      cwd,
      JSON.stringify(defaultExperimentsOutput),
      Command.EXPERIMENT,
      SubCommand.SHOW,
      ...flags,
      Flag.JSON
    )
    if (isDvcError(output) || isEmpty(output)) {
      return { workspace: { baseline: output as DvcError | {} } }
    }
    return output
  }

  public plotsDiff(
    cwd: string,
    ...revisions: string[]
  ): Promise<PlotsOutput | DvcError> {
    return this.readProcessJson<PlotsOutput>(
      cwd,
      Command.PLOTS,
      SubCommand.DIFF,
      ...revisions,
      Flag.OUTPUT_PATH,
      TEMP_PLOTS_DIR,
      Flag.SPLIT
    )
  }

  public async root(cwd: string): Promise<string | undefined> {
    try {
      return await this.executeDvcProcess(cwd, Command.ROOT)
    } catch {}
  }

  public version(cwd: string): Promise<string> {
    return this.executeDvcProcess(cwd, Flag.VERSION)
  }

  private readProcessJson<T extends DataStatusOutput | PlotsOutput>(
    cwd: string,
    command: Command,
    ...args: Args
  ) {
    return this.readProcess<T>(cwd, '{}', command, ...args, Flag.JSON)
  }

  private async readProcess<
    T extends DataStatusOutput | ExperimentsOutput | PlotsOutput
  >(cwd: string, defaultValue: string, ...args: Args): Promise<T | DvcError> {
    try {
      const output =
        (await this.executeDvcProcess(cwd, ...args)) || defaultValue
      return JSON.parse(output) as T
    } catch (error: unknown) {
      const msg =
        (error as MaybeConsoleError).stderr || (error as Error).message
      Logger.error(`${args} failed with ${msg} retrying...`)
      return { error: { msg, type: 'Caught error' } }
    }
  }
}
