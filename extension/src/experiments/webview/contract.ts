import {
  BaseExperimentFields,
  ExperimentStatus,
  ValueTree
} from '../../cli/dvc/contract'
import { FilteredCounts } from '../model/filterBy/collect'
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

export type RunningExperiment = { executor: string; id: string }

export type CommitData = {
  author: string
  tags: string[]
  message: string
  date: string
}

export interface Experiment extends BaseExperimentFields {
  deps?: DepColumns
  displayColor?: string
  displayNameOrParent?: string
  error?: string
  id: string
  label: string
  logicalGroupName?: string
  metrics?: MetricOrParamColumns
  mutable?: boolean
  outs?: MetricOrParamColumns
  params?: MetricOrParamColumns
  selected?: boolean
  sha?: string
  starred?: boolean
  Created?: string
  commit?: CommitData
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
}): boolean => isRunning(status) && executor === 'dvc-task'

export interface Row extends Experiment {
  subRows?: Row[]
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
  columnOrder: string[]
  columns: Column[]
  columnWidths: Record<string, number>
  hasCheckpoints: boolean
  hasColumns: boolean
  hasConfig: boolean
  hasRunningExperiment: boolean
  hasValidDvcYaml: boolean
  rows: Row[]
  sorts: SortDefinition[]
  filteredCounts: FilteredCounts
  filters: string[]
}

export type InitiallyUndefinedTableData = TableData | undefined
