export const MIN_CLI_VERSION = '2.58.1'
export const LATEST_TESTED_CLI_VERSION = '3.26.0'

export const PLOT_TEMPLATES = [
  'simple',
  'linear',
  'confusion',
  'confusion_normalized',
  'scatter',
  'scatter_jitter',
  'smooth',
  'bar_horizontal_sorted',
  'bar_horizontal'
]

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

type RelPathObject<T> = {
  [relPath: string]: T
}

export type ValueTree = {
  [key: string]: Value | ValueTree
}

export const isValueTree = (
  value: Value | ValueTree
): value is NonNullable<ValueTree> =>
  !!(value && !Array.isArray(value) && typeof value === 'object')

export enum ExecutorStatus {
  FAILED = 'failed',
  QUEUED = 'queued',
  RUNNING = 'running',
  SUCCESS = 'success'
}

export const EXPERIMENT_WORKSPACE_ID = 'workspace' as const

type Dep = { hash: null | string; size: null | number; nfiles: null | number }
type Out = Dep & { use_cache: boolean; is_data_source: boolean }

type Outs = RelPathObject<Out>
export type Deps = RelPathObject<Dep>

export type FileDataOrError = { data: ValueTree } | DvcError
export type MetricsOrParams = RelPathObject<FileDataOrError>

export const fileHasError = (file: FileDataOrError): file is DvcError =>
  !!(file as DvcError).error

export const DEFAULT_EXP_SHOW_OUTPUT = [
  {
    rev: EXPERIMENT_WORKSPACE_ID
  }
]

export type ExpData = {
  rev: string
  timestamp: string | null
  params: MetricsOrParams | null
  metrics: MetricsOrParams | null
  deps: Deps | null
  outs: Outs | null
  meta: { has_checkpoints: boolean }
}

export enum Executor {
  DVC_TASK = 'dvc-task',
  WORKSPACE = 'workspace'
}

export type ExecutorState = {
  state: ExecutorStatus
  name: Executor | null
  local: {
    root: string | null
    log: string | null
    pid: number | null
    task_id?: string
    returncode: null | number
  } | null
} | null

export type ExpWithError = {
  rev: string
  name?: string
} & DvcError

type ExpWithData = {
  rev: string
  name?: string
  data?: ExpData
}

export type ExpState = ExpWithData | ExpWithError

export type ExpRange = {
  revs: ExpState[]
  name?: string
  executor: ExecutorState
}

export const experimentHasError = (
  expState: ExpState
): expState is ExpWithError => !!(expState as { error?: unknown }).error

export type ExpShowOutput = (ExpState & { experiments?: ExpRange[] | null })[]

export enum PlotsType {
  VEGA = 'vega',
  IMAGE = 'image'
}
export const isImagePlotOutput = (plot: {
  type: PlotsType
}): plot is ImagePlotOutput => plot.type === PlotsType.IMAGE

export type AnchorDefinitions = {
  '<DVC_METRIC_DATA>': string
  '<DVC_METRIC_SHAPE>'?: string
  '<DVC_METRIC_STROKE_DASH>'?: string
  '<DVC_METRIC_COLOR>'?: string
  // fun '<DVC_METRIC_X_LABEL>': string
  // '<DVC_METRIC_Y_LABEL>': string
}

export type TemplatePlot = {
  anchor_definitions: AnchorDefinitions
  content: string
  revisions: string[]
  type: PlotsType
}

export type ImagePlotOutput = {
  revisions: string[]
  type: PlotsType
  url: string
}

export type PlotOutput = TemplatePlot | ImagePlotOutput

export interface PlotsData {
  [path: string]: PlotOutput[]
}

export type PlotError = {
  name?: string
  rev: string
  source?: string
} & ErrorContents

export type RawPlotsOutput = {
  data?: { [path: string]: PlotOutput[] }
  errors?: PlotError[]
}

export type PlotsOutput = RawPlotsOutput & {
  data: { [path: string]: PlotOutput[] }
}

export type PlotsOutputOrError = PlotsOutput | DvcError
