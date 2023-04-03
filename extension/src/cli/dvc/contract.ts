import { Plot } from '../../plots/webview/contract'

export const MIN_CLI_VERSION = '2.52.0'
export const LATEST_TESTED_CLI_VERSION = '2.52.0'
export const MAX_CLI_VERSION = '3'

type ErrorContents = { type: string; msg: string }

export type DvcError = { error: ErrorContents }

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
  error?: ErrorContents
}

type RelPathObject<T> = {
  [relPath: string]: T
}

export type ValueTreeRoot = RelPathObject<ValueTreeOrError>

export interface ValueTreeNode {
  [key: string]: Value | ValueTree
}

export type ValueTree = ValueTreeRoot | ValueTreeNode

export const isValueTree = (
  value: Value | ValueTree
): value is NonNullable<ValueTree> =>
  !!(value && !Array.isArray(value) && typeof value === 'object')

export enum ExperimentStatus {
  FAILED = 'Failed',
  QUEUED = 'Queued',
  RUNNING = 'Running',
  SUCCESS = 'Success'
}

export const EXPERIMENT_WORKSPACE_ID = 'workspace'

export interface BaseExperimentFields {
  name?: string
  timestamp?: string | null
  status?: ExperimentStatus
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
  error?: ErrorContents
}

export interface ExperimentFieldsOrError {
  data?: ExperimentFields
  error?: ErrorContents
}

export interface ExperimentsCommitOutput {
  [sha: string]: ExperimentFieldsOrError
  baseline: ExperimentFieldsOrError
}

export interface ExperimentsOutput {
  [name: string]: ExperimentsCommitOutput
  [EXPERIMENT_WORKSPACE_ID]: {
    baseline: ExperimentFieldsOrError
  }
}

export interface PlotsData {
  [path: string]: Plot[]
}

export type PlotError = {
  name?: string
  rev: string
  source?: string
} & ErrorContents

export type RawPlotsOutput = {
  data?: { [path: string]: Plot[] }
  errors?: PlotError[]
}

export type PlotsOutput = RawPlotsOutput & {
  data: { [path: string]: Plot[] }
}

export type PlotsOutputOrError = PlotsOutput | DvcError
