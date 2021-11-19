import { TableData } from '../experiments/webview/contract'
import { PlotsData } from '../plots/webview/contract'

export type WebviewData = TableData | PlotsData

export type ColumnReorderPayload = string[]
export type ColumnResizePayload = {
  id: string
  width: number
}

export type MessageFromWebview = {
  type: MessageFromWebviewType
  payload?: ColumnReorderPayload | ColumnResizePayload
}

export enum MessageFromWebviewType {
  INITIALIZED = 'initialized',
  COLUMN_REORDERED = 'column-reordered',
  COLUMN_RESIZED = 'column-resized'
}

export interface WindowWithWebviewData {
  webviewData: {
    theme: WebviewColorTheme
  }
}

export enum WebviewColorTheme {
  LIGHT = 'light',
  DARK = 'dark'
}

export interface setData<T extends WebviewData> {
  type: MessageToWebviewType.SET_DATA
  data: T
}

export type MessageToWebview<T extends WebviewData> =
  | {
      type: MessageToWebviewType.SET_DVC_ROOT
      dvcRoot: string
    }
  | {
      type: MessageToWebviewType.SET_THEME
      theme: WebviewColorTheme
    }
  | setData<T>

export enum MessageToWebviewType {
  SET_DVC_ROOT = 'setDvcRoot',
  SET_THEME = 'setTheme',
  SET_DATA = 'setData'
}

export interface WebviewState<T extends WebviewData | unknown> {
  dvcRoot: string
  data: T
}

export type UnknownWebviewState = WebviewState<unknown>
