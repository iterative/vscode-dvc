import { VisualizationSpec } from 'react-vega'
import { Color } from '../../experiments/model/status/colors'

export const DEFAULT_NB_ITEMS_PER_ROW = 2

export enum PlotHeight {
  SMALLER,
  SMALL,
  REGULAR,
  SQUARE,
  VERTICAL_NORMAL,
  VERTICAL_LARGER
}

export const DEFAULT_PLOT_HEIGHT = PlotHeight.SMALL

export const DEFAULT_PLOT_WIDTH = 2

export enum PlotsSection {
  TEMPLATE_PLOTS = 'template-plots',
  COMPARISON_TABLE = 'comparison-table',
  CUSTOM_PLOTS = 'custom-plots'
}

export const DEFAULT_SECTION_NB_ITEMS_PER_ROW_OR_WIDTH = {
  [PlotsSection.TEMPLATE_PLOTS]: DEFAULT_NB_ITEMS_PER_ROW,
  [PlotsSection.COMPARISON_TABLE]: DEFAULT_PLOT_WIDTH,
  [PlotsSection.CUSTOM_PLOTS]: DEFAULT_NB_ITEMS_PER_ROW
}

export const DEFAULT_HEIGHT = {
  [PlotsSection.TEMPLATE_PLOTS]: DEFAULT_PLOT_HEIGHT,
  [PlotsSection.COMPARISON_TABLE]: DEFAULT_PLOT_HEIGHT,
  [PlotsSection.CUSTOM_PLOTS]: DEFAULT_PLOT_HEIGHT
}

export const DEFAULT_SECTION_COLLAPSED = {
  [PlotsSection.TEMPLATE_PLOTS]: false,
  [PlotsSection.COMPARISON_TABLE]: false,
  [PlotsSection.CUSTOM_PLOTS]: false
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
  commit?: string
  displayColor: Color
  errors?: string[]
  fetched: boolean
  firstThreeColumns: RevisionFirstThreeColumns
  group?: string
  id?: string
  revision: string
}

export interface PlotsComparisonData {
  plots: ComparisonPlots
  width: number
  height: PlotHeight
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
}[]

export type CheckpointPlotValues = {
  group: string
  iteration: number
  y: number
}[]

export type ColorScale = { domain: string[]; range: Color[] }

type CustomPlotBase = {
  id: string
  metric: string
  param: string
}

export type CheckpointPlot = {
  values: CheckpointPlotValues
  type: CustomPlotType.CHECKPOINT
} & CustomPlotBase

export type MetricVsParamPlot = {
  values: MetricVsParamPlotValues
  type: CustomPlotType.METRIC_VS_PARAM
} & CustomPlotBase

export type CustomPlot = MetricVsParamPlot | CheckpointPlot

export type CustomPlotData = CustomPlot & {
  spec: VisualizationSpec
}

export type CustomPlotsData = {
  plots: CustomPlotData[]
  nbItemsPerRow: number
  colors: ColorScale | undefined
  enablePlotCreation: boolean
  height: PlotHeight
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
  height: PlotHeight
}

export type ComparisonPlot = {
  url: string | undefined
  revision: string
  errors: string[] | undefined
  loading: boolean
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
