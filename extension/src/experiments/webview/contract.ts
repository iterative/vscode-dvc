import { BaseExperimentFields, ValueTree } from '../../cli/reader'
import { SortDefinition } from '../model/sortBy'

export interface MetricsOrParams {
  [filename: string]: ValueTree
}

export interface Experiment extends BaseExperimentFields {
  id: string
  displayName: string
  params?: MetricsOrParams
  metrics?: MetricsOrParams
  displayColor?: string
  selected?: boolean
}

export interface RowData extends Experiment {
  subRows?: RowData[]
}

export interface MetricOrParamAggregateData {
  maxStringLength?: number
  maxNumber?: number
  minNumber?: number
}

export interface MetricOrParam extends MetricOrParamAggregateData {
  group: string
  hasChildren: boolean
  name: string
  path: string
  parentPath: string
  types?: string[]
}

export type TableData = {
  rows: RowData[]
  columns: MetricOrParam[]
  sorts: SortDefinition[]
  changes: string[]
  columnOrder: string[]
  columnWidths: Record<string, number>
}

export type InitiallyUndefinedTableData = TableData | undefined
