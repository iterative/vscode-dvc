import { BaseExperimentFields, ValueTree } from '../../cli/dvc/reader'
import { FilteredCounts } from '../model/filterBy/collect'
import { SortDefinition } from '../model/sortBy'

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
}

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
  parentPath: string
  path: string
  pathArray?: string[]
  type: ColumnType
  types?: string[]
}

export type TableData = {
  changes: string[]
  columnOrder: string[]
  columns: Column[]
  columnWidths: Record<string, number>
  hasCheckpoints: boolean
  hasColumns: boolean
  hasRunningExperiment: boolean
  rows: Row[]
  sorts: SortDefinition[]
  filteredCounts: FilteredCounts
  filters: string[]
}

export type InitiallyUndefinedTableData = TableData | undefined
