import { ExperimentFields } from '../../cli/reader'

export interface Experiment extends ExperimentFields {
  id: string
  displayName: string
  path: string
  level?: number
  parentPath?: string
}

export interface ColumnAggregateData {
  maxStringLength?: number
  maxNumber?: number
  minNumber?: number
}

export interface ColumnData extends ColumnAggregateData {
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
