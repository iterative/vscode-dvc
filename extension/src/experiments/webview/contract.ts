import { BaseExperimentFields, ValueTree } from '../../cli/reader'
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

export interface WindowWithWebviewData {
  webviewData: {
    theme: WebviewColorTheme
  }
}

export enum WebviewColorTheme {
  light = 'light',
  dark = 'dark'
}

export type MessageFromWebview = {
  type: MessageFromWebviewType
}

export enum MessageFromWebviewType {
  initialized = 'initialized'
}

export type MessageToWebview = {
  errors?: Error[]
} & (
  | {
      type: MessageToWebviewType.setDvcRoot
      dvcRoot: string
    }
  | {
      type: MessageToWebviewType.setTheme
      theme: WebviewColorTheme
    }
  | {
      type: MessageToWebviewType.setData
      data: TableData
    }
)

export enum MessageToWebviewType {
  setDvcRoot = 'setDvcRoot',
  setTheme = 'setTheme',
  setData = 'setData'
}

export interface TableData {
  rows: RowData[]
  columns: ParamOrMetric[]
  sorts: SortDefinition[]
  changes: string[]
}

export interface ExperimentsWebviewState {
  dvcRoot: string
  data?: TableData
}
