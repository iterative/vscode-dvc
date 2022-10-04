import { Plot } from '../../plots/webview/contract'

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

export interface PlotsOutput {
  [path: string]: Plot[]
}
