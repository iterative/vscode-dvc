import { BaseExperimentFields, ValueTree } from '../../cli/reader'
import {
  MessageToWebview as GenericMessageToWebview,
  WebviewState as GenericWebviewState
} from '../../webview/contract'
import { SortDefinition } from '../model/sortBy'

export interface ParamsOrMetrics {
  [filename: string]: ValueTree
}

export interface Experiment extends BaseExperimentFields {
  id: string
  displayName: string
  params?: ParamsOrMetrics
  metrics?: ParamsOrMetrics
}

export interface RowData extends Experiment {
  subRows?: RowData[]
}

export interface ParamOrMetricAggregateData {
  maxStringLength?: number
  maxNumber?: number
  minNumber?: number
}

export interface ParamOrMetric extends ParamOrMetricAggregateData {
  group: string
  hasChildren: boolean
  name: string
  path: string
  parentPath: string
  types?: string[]
}

export const WebviewType = 'Experiments'

export interface TableData {
  rows: RowData[]
  columns: ParamOrMetric[]
  sorts: SortDefinition[]
  changes: string[]
  columnsOrder: string[]
}

export type MessageToWebview = GenericMessageToWebview<TableData>

export type WebviewState = GenericWebviewState<TableData>
