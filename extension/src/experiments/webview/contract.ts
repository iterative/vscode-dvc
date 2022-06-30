import { BaseExperimentFields, ValueTree } from '../../cli/reader'
import { FilteredCounts } from '../model/filterBy/collect'
import { SortDefinition } from '../model/sortBy'

export interface MetricOrParamColumns {
  [filename: string]: ValueTree
}

export interface DepColumns {
  [path: string]: string
}

export interface Experiment extends BaseExperimentFields {
  id: string
  label: string
  displayNameOrParent?: string
  logicalGroupName?: string
  params?: MetricOrParamColumns
  metrics?: MetricOrParamColumns
  deps?: DepColumns
  outs?: MetricOrParamColumns
  displayColor?: string
  selected?: boolean
  starred?: boolean
  mutable?: boolean
  sha?: string
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
  DEPS = 'deps'
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
