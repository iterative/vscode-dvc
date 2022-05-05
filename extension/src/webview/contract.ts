import { SortDefinition } from '../experiments/model/sortBy'
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
  COLUMN_SORTED = 'column-sorted',
  COLUMN_SORT_REMOVED = 'column-sort-removed',
  EXPERIMENT_TOGGLED = 'experiment-toggled',
  EXPERIMENT_APPLIED_TO_WORKSPACE = 'experiment-applied-to-workspace',
  BRANCH_CREATED_FROM_EXPERIMENT = 'branch-created-from-experiment',
  EXPERIMENT_QUEUE_AND_PARAMS_VARIED = 'experiment-queue-and-params-varied',
  EXPERIMENT_REMOVED = 'experiment-removed',
  METRIC_TOGGLED = 'metric-toggled',
  PLOTS_COMPARISON_REORDERED = 'plots-comparison-reordered',
  PLOTS_METRICS_REORDERED = 'plots-metrics-reordered',
  PLOTS_SECTION_TOGGLED = 'plots-section-toggled',
  PLOTS_TEMPLATES_REORDERED = 'plots-templates-reordered',
  PLOTS_RESIZED = 'plots-resized',
  SECTION_RENAMED = 'section-renamed'
}

export type ColumnResizePayload = {
  id: string
  width: number
}
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
      payload: string[]
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
      type: MessageFromWebviewType.EXPERIMENT_APPLIED_TO_WORKSPACE
      payload: string
    }
  | {
      type: MessageFromWebviewType.BRANCH_CREATED_FROM_EXPERIMENT
      payload: string
    }
  | {
      type: MessageFromWebviewType.EXPERIMENT_QUEUE_AND_PARAMS_VARIED
      payload: string
    }
  | {
      type: MessageFromWebviewType.EXPERIMENT_REMOVED
      payload: string
    }
  | {
      type: MessageFromWebviewType.COLUMN_SORTED
      payload: SortDefinition
    }
  | {
      type: MessageFromWebviewType.COLUMN_SORT_REMOVED
      payload: string
    }
  | {
      type: MessageFromWebviewType.METRIC_TOGGLED
      payload: string[]
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
      payload: Partial<SectionCollapsed>
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

export type MessageToWebview<T extends WebviewData> = {
  type: MessageToWebviewType.SET_DATA
  data: T
}

export enum MessageToWebviewType {
  SET_DATA = 'setData'
}

export interface WebviewState {
  dvcRoot: string
}
