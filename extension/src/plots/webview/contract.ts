import { VisualizationSpec } from 'react-vega'
import { Color } from '../../experiments/model/status/colors'

export const DEFAULT_NB_ITEMS_PER_ROW = 2

export enum Section {
  TEMPLATE_PLOTS = 'template-plots',
  COMPARISON_TABLE = 'comparison-table',
  CUSTOM_PLOTS = 'custom-plots'
}

export const DEFAULT_SECTION_NB_ITEMS_PER_ROW = {
  [Section.TEMPLATE_PLOTS]: DEFAULT_NB_ITEMS_PER_ROW,
  [Section.COMPARISON_TABLE]: DEFAULT_NB_ITEMS_PER_ROW,
  [Section.CUSTOM_PLOTS]: DEFAULT_NB_ITEMS_PER_ROW
}

// Height is undefined by default because it is calculated by ratio of the width it'll fill (calculated by the webview)
export const DEFAULT_HEIGHT = {
  [Section.TEMPLATE_PLOTS]: undefined,
  [Section.COMPARISON_TABLE]: undefined,
  [Section.CUSTOM_PLOTS]: undefined
}

export const DEFAULT_SECTION_COLLAPSED = {
  [Section.TEMPLATE_PLOTS]: false,
  [Section.COMPARISON_TABLE]: false,
  [Section.CUSTOM_PLOTS]: false
}

export type SectionCollapsed = typeof DEFAULT_SECTION_COLLAPSED

export type ComparisonRevisionData = { [revision: string]: ComparisonPlot }

export type ComparisonPlots = {
  path: string
  revisions: ComparisonRevisionData
}[]

export type RevisionFirstThreeColumns = Array<{
  path: string
  value: string | number
  type: string
}>

export type Revision = {
  id?: string
  revision: string
  group?: string
  displayColor: Color
  fetched: boolean
  commit?: string
  firstThreeColumns: RevisionFirstThreeColumns
}

export interface PlotsComparisonData {
  plots: ComparisonPlots
  nbItemsPerRow: number
  height: number | undefined
  revisions: Revision[]
}

export enum CustomPlotType {
  CHECKPOINT = 'checkpoint',
  METRIC_VS_PARAM = 'metricVsParam'
}

export type MetricVsParamPlotValues = {
  expName: string
  metric: number
  param: number
}

export type CheckpointPlotValues = {
  group: string
  iteration: number
  y: number
}[]

export type ColorScale = { domain: string[]; range: Color[] }

export type CheckpointPlot = {
  id: string
  metric: string
  values: CheckpointPlotValues
  type: CustomPlotType.CHECKPOINT
}

export type CheckpointPlotData = CheckpointPlot & { yTitle: string }

export type CheckpointPlotsData = {
  plots: CheckpointPlotData[]
  colors: ColorScale
  nbItemsPerRow: number
  height: number | undefined
  selectedMetrics?: string[]
}

export type MetricVsParamPlot = {
  id: string
  values: MetricVsParamPlotValues[]
  metric: string
  param: string
  type: CustomPlotType.METRIC_VS_PARAM
}

export type MetricVsParamPlotData = MetricVsParamPlot & { yTitle: string }

export type CustomPlot = MetricVsParamPlot | CheckpointPlot
export type CustomPlotData = MetricVsParamPlotData | CheckpointPlotData

export type CustomPlotsData = {
  plots: CustomPlotData[]
  nbItemsPerRow: number
  height: number | undefined
  colors: ColorScale | undefined
}

export enum PlotsType {
  VEGA = 'vega',
  IMAGE = 'image'
}

export const isVegaPlot = (plot: Plot): plot is TemplatePlot =>
  plot.type === PlotsType.VEGA

export type TemplatePlot = {
  content: VisualizationSpec
  datapoints?: { [revision: string]: Record<string, unknown>[] }
  revisions?: string[]
  type: PlotsType
  multiView?: boolean
}

export type ImagePlot = {
  revisions?: string[]
  type: PlotsType
  url: string
  multiView?: boolean
}

export const isImagePlot = (plot: Plot): plot is ImagePlot =>
  plot.type === PlotsType.IMAGE

export type Plot = TemplatePlot | ImagePlot

export type TemplatePlots = { [path: string]: TemplatePlot[] }

export enum TemplatePlotGroup {
  MULTI_VIEW = 'template-multi',
  SINGLE_VIEW = 'template-single'
}

export type TemplatePlotEntry = TemplatePlot & { id: string }

export type TemplatePlotSection = {
  group: TemplatePlotGroup
  entries: TemplatePlotEntry[]
}

export interface TemplatePlotsData {
  plots: TemplatePlotSection[]
  nbItemsPerRow: number
  height: number | undefined
}

export type ComparisonPlot = {
  url?: string
  revision: string
}

export enum PlotsDataKeys {
  COMPARISON = 'comparison',
  CUSTOM = 'custom',
  HAS_UNSELECTED_PLOTS = 'hasUnselectedPlots',
  HAS_PLOTS = 'hasPlots',
  SELECTED_REVISIONS = 'selectedRevisions',
  TEMPLATE = 'template',
  SECTION_COLLAPSED = 'sectionCollapsed'
}

export type PlotsData =
  | {
      [PlotsDataKeys.COMPARISON]?: PlotsComparisonData | null
      [PlotsDataKeys.CUSTOM]?: CustomPlotsData | null
      [PlotsDataKeys.HAS_PLOTS]?: boolean
      [PlotsDataKeys.HAS_UNSELECTED_PLOTS]?: boolean
      [PlotsDataKeys.SELECTED_REVISIONS]?: Revision[]
      [PlotsDataKeys.TEMPLATE]?: TemplatePlotsData | null
      [PlotsDataKeys.SECTION_COLLAPSED]?: SectionCollapsed
    }
  | undefined
