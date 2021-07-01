import { ColumnAggregateData } from '../collectFromRepo'
import { Experiment as RowData } from '../types'

export type Experiment = RowData
export interface ColumnData extends ColumnAggregateData {
  group: string
  name: string
  path: string[]
  types?: string[]
  childColumns?: ColumnData[]
}

export const WebviewType = 'Experiments'

export interface WindowWithWebviewData {
  webviewData: {
    publicPath: string
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
      type: MessageToWebviewType.showExperiments
      tableData: TableData
    }
)

export enum MessageToWebviewType {
  setDvcRoot = 'setDvcRoot',
  setTheme = 'setTheme',
  showExperiments = 'showExperiments'
}

export interface TableData {
  rows: Experiment[]
  columns: ColumnData[]
}

export interface ExperimentsWebviewState {
  dvcRoot: string
  tableData?: TableData
}
