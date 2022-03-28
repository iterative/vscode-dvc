import { TableData } from '../experiments/webview/contract'
import {
  PlotsData,
  PlotSize,
  Section,
  SectionCollapsed,
  TemplatePlotGroup
} from '../plots/webview/contract'

export type WebviewData = TableData | PlotsData

export enum MessageFromWebviewType {
  INITIALIZED = 'initialized',
  COLUMN_REORDERED = 'column-reordered',
  COLUMN_RESIZED = 'column-resized',
  EXPERIMENT_TOGGLED = 'experiment-toggled',
  METRIC_TOGGLED = 'metric-toggled',
  PLOTS_COMPARISON_REORDERED = 'plots-comparison-reordered',
  PLOTS_METRICS_REORDERED = 'plots-metrics-reordered',
  PLOTS_SECTION_TOGGLED = 'plots-section-toggled',
  PLOTS_TEMPLATES_REORDERED = 'plots-templates-reordered',
  PLOTS_RESIZED = 'plots-resized',
  SECTION_RENAMED = 'section-renamed'
}

export type ColumnReorderPayload = string[]

export type ColumnResizePayload = {
  id: string
  width: number
}
export type MetricToggledPayload = string[]
export type PlotsResizedPayload = { section: Section; size: PlotSize }
export type PlotSectionRenamedPayload = {
  section: Section
  name: string
}
export type PlotsTemplatesReordered = {
  group: TemplatePlotGroup
  paths: string[]
}[]

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
      type: MessageFromWebviewType.EXPERIMENT_TOGGLED
      payload: string
    }
  | {
      type: MessageFromWebviewType.METRIC_TOGGLED
      payload: MetricToggledPayload
    }
  | {
      type: MessageFromWebviewType.PLOTS_COMPARISON_REORDERED
      payload: string[]
    }
  | {
      type: MessageFromWebviewType.PLOTS_METRICS_REORDERED
      payload: string[]
    }
  | {
      type: MessageFromWebviewType.PLOTS_RESIZED
      payload: PlotsResizedPayload
    }
  | {
      type: MessageFromWebviewType.PLOTS_SECTION_TOGGLED
      payload: SectionCollapsed
    }
  | {
      type: MessageFromWebviewType.PLOTS_TEMPLATES_REORDERED
      payload: PlotsTemplatesReordered
    }
  | {
      type: MessageFromWebviewType.SECTION_RENAMED
      payload: PlotSectionRenamedPayload
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
