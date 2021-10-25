import { TableData } from '../experiments/webview/contract'
import { PlotsData } from '../plots/webview/contract'

export type WebviewData = TableData | PlotsData

export enum ViewKey {
  EXPERIMENTS = 'dvc-experiments',
  PLOTS = 'dvc-plots'
}

export type MessageFromWebview = {
  type: MessageFromWebviewType
  payload?: Object
}

export enum MessageFromWebviewType {
  initialized = 'initialized',
  columnReordered = 'column-reordered'
}

export interface WindowWithWebviewData {
  webviewData: {
    theme: WebviewColorTheme
  }
}

export enum WebviewColorTheme {
  light = 'light',
  dark = 'dark'
}

export interface setData<T> {
  type: MessageToWebviewType.setData
  webviewData: T
}

export type GenericMessageToWebview<T> = {
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
  | setData<T>
)

export enum MessageToWebviewType {
  setDvcRoot = 'setDvcRoot',
  setTheme = 'setTheme',
  setData = 'setData'
}

export interface GenericWebviewState<
  T extends PlotsData | TableData | unknown
> {
  dvcRoot: string
  webviewData?: T
}

export type WebviewState = GenericWebviewState<WebviewData>
