import { TableData } from '../experiments/webview/contract'
import { PlotsData, PlotSize } from '../plots/webview/contract'

export type WebviewData = TableData | PlotsData

export type ColumnReorderPayload = string[]
export type ColumnResizePayload = {
  id: string
  width: number
}
export type MetricToggledPayload = string[]
export type PlotsResizedPayload = PlotSize

export type MessageFromWebview = {
  type: MessageFromWebviewType
  payload?:
    | ColumnReorderPayload
    | ColumnResizePayload
    | MetricToggledPayload
    | PlotsResizedPayload
}

export enum MessageFromWebviewType {
  INITIALIZED = 'initialized',
  COLUMN_REORDERED = 'column-reordered',
  COLUMN_RESIZED = 'column-resized',
  METRIC_TOGGLED = 'metric-toggled',
  PLOTS_RESIZED = 'plots-resized'
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
  | setData<T>

export enum MessageToWebviewType {
  SET_DVC_ROOT = 'setDvcRoot',
  SET_DATA = 'setData'
}

export interface WebviewState {
  dvcRoot: string
}
