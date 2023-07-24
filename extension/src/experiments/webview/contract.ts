import { Executor, ExperimentStatus, ValueTree } from '../../cli/dvc/contract'
import { SortDefinition } from '../model/sortBy'

export { ExperimentStatus } from '../../cli/dvc/contract'

export interface MetricOrParamColumns {
  [filename: string]: ValueTree
}

export interface ValueWithChanges {
  value: string | number
  changes: boolean
}

export interface DepColumns {
  [path: string]: ValueWithChanges
}

export type RunningExperiment = {
  executor: Executor
  id: string
}

export type CommitData = {
  author: string
  tags: string[]
  message: string
  date: string
}

export enum GitRemoteStatus {
  NOT_ON_REMOTE = 'not-on-remote',
  PUSHING = 'pushing',
  ON_REMOTE = 'on-remote'
}

export type Experiment = {
  commit?: CommitData
  Created?: string
  deps?: DepColumns
  displayColor?: string
  description?: string
  error?: string
  executor?: Executor
  id: string
  label: string
  metrics?: MetricOrParamColumns
  outs?: MetricOrParamColumns
  params?: MetricOrParamColumns
  gitRemoteStatus?: GitRemoteStatus
  selected?: boolean
  sha?: string
  starred?: boolean
  status?: ExperimentStatus
  timestamp?: string | null
  branch?: string | undefined
}

export const isRunning = (status: ExperimentStatus | undefined): boolean =>
  status === ExperimentStatus.RUNNING

export const isQueued = (status: ExperimentStatus | undefined): boolean =>
  status === ExperimentStatus.QUEUED

export const isRunningInQueue = ({
  status,
  executor
}: {
  status?: ExperimentStatus
  executor?: string | null
}): boolean => isRunning(status) && executor === Executor.DVC_TASK

export interface Commit extends Experiment {
  subRows?: Experiment[]
}

export interface ColumnAggregateData {
  maxStringLength?: number
  maxNumber?: number
  minNumber?: number
}

export enum ColumnType {
  METRICS = 'metrics',
  PARAMS = 'params',
  DEPS = 'deps',
  TIMESTAMP = 'timestamp'
}

export interface Column extends ColumnAggregateData {
  hasChildren: boolean
  label: string
  parentPath?: string
  path: string
  pathArray?: string[]
  type: ColumnType
  types?: string[]
  width?: number
}

export type TableData = {
  changes: string[]
  cliError: string | null
  columnOrder: string[]
  columns: Column[]
  columnWidths: Record<string, number>
  filters: string[]
  hasBranchesToSelect: boolean
  hasCheckpoints: boolean
  hasColumns: boolean
  hasConfig: boolean
  hasMoreCommits: Record<string, boolean>
  hasRunningWorkspaceExperiment: boolean
  isShowingMoreCommits: Record<string, boolean>
  rows: Commit[]
  selectedForPlotsCount: number
  sorts: SortDefinition[]
}

export type InitiallyUndefinedTableData = TableData | undefined
