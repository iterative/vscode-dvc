import { TableData } from '../experiments/webview/contract'
import { PlotsData, SectionCollapsed } from '../plots/webview/contract'

export type WebviewData = TableData | PlotsData

export enum MessageFromWebviewType {
  INITIALIZED = 'initialized',
  COLUMN_REORDERED = 'column-reordered',
  COLUMN_RESIZED = 'column-resized',
  METRIC_TOGGLED = 'metric-toggled',
  PLOTS_SECTION_TOGGLED = 'plots-section-toggled'
}

export type ColumnReorderPayload = string[]

export type ColumnResizePayload = {
  id: string
  width: number
}
export type MetricToggledPayload = string[]

export type MessageFromWebview =
  | {
      type: MessageFromWebviewType.COLUMN_REORDERED
      payload: ColumnReorderPayload
    }
  | {
      type: MessageFromWebviewType.COLUMN_RESIZED
      payload: ColumnResizePayload
    }
  | {
      type: MessageFromWebviewType.METRIC_TOGGLED
      payload: MetricToggledPayload
    }
  | {
      type: MessageFromWebviewType.PLOTS_SECTION_TOGGLED
      payload: SectionCollapsed
    }
  | { type: MessageFromWebviewType.INITIALIZED }

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
