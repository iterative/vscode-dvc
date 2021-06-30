import { ColumnAggregateData } from '../collectFromRepo'
import { ExperimentsRepoJSONOutput } from '../contract'

export interface ColumnData extends ColumnAggregateData {
  name: string
  types?: string[]
  childColumns?: ColumnData[]
  ancestors?: string[]
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
      tableData?: ExperimentsRepoJSONOutput | null
      params?: ColumnData[]
      metrics?: ColumnData[]
    }
)

export enum MessageToWebviewType {
  setDvcRoot = 'setDvcRoot',
  setTheme = 'setTheme',
  showExperiments = 'showExperiments'
}

export interface ExperimentsWebviewState {
  dvcRoot: string
  experiments?: ExperimentsRepoJSONOutput
}
