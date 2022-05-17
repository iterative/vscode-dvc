import { BaseExperimentFields, ValueTree } from '../../cli/reader'
import { SortDefinition } from '../model/sortBy'

export interface Columns {
  [filename: string]: ValueTree
}

export interface Experiment extends BaseExperimentFields {
  id: string
  label: string
  displayNameOrParent?: string
  params?: Columns
  metrics?: Columns
  displayColor?: string
  selected?: boolean
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
  PARAMS = 'params'
}

export interface Column extends ColumnAggregateData {
  hasChildren: boolean
  name: string
  parentPath: string
  path: string
  pathArray?: string[]
  type: ColumnType
  types?: string[]
}

export type TableData = {
  rows: Row[]
  columns: Column[]
  sorts: SortDefinition[]
  changes: string[]
  columnOrder: string[]
  columnWidths: Record<string, number>
}

export type InitiallyUndefinedTableData = TableData | undefined
