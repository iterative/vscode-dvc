import { BaseExperimentFields, ValueTree } from '../../cli/reader'
import { SortDefinition } from '../model/sortBy'

export interface MetricsOrParams {
  [filename: string]: ValueTree
}

export interface Experiment extends BaseExperimentFields {
  id: string
  label: string
  displayNameOrParent?: string
  params?: MetricsOrParams
  metrics?: MetricsOrParams
  displayColor?: string
  selected?: boolean
  mutable?: boolean
  sha?: string
}

export interface RowData extends Experiment {
  subRows?: RowData[]
}

export interface MetricOrParamAggregateData {
  maxStringLength?: number
  maxNumber?: number
  minNumber?: number
}

export enum MetricOrParamType {
  METRICS = 'metrics',
  PARAMS = 'params'
}

export interface MetricOrParam extends MetricOrParamAggregateData {
  hasChildren: boolean
  name: string
  parentPath: string
  path: string
  pathArray?: string[]
  type: MetricOrParamType
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
