import { VisualizationSpec } from 'react-vega'
import { Color } from '../../experiments/model/status/colors'

export const DEFAULT_NB_ITEMS_PER_ROW = undefined

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
  CHECKPOINT_PLOTS = 'checkpoint-plots',
  TEMPLATE_PLOTS = 'template-plots',
  COMPARISON_TABLE = 'comparison-table',
  CUSTOM_PLOTS = 'custom-plots'
}

export const DEFAULT_SECTION_NB_ITEMS_PER_ROW_OR_WIDTH = {
  [PlotsSection.CHECKPOINT_PLOTS]: DEFAULT_NB_ITEMS_PER_ROW,
  [PlotsSection.TEMPLATE_PLOTS]: DEFAULT_NB_ITEMS_PER_ROW,
  [PlotsSection.COMPARISON_TABLE]: DEFAULT_PLOT_WIDTH,
  [PlotsSection.CUSTOM_PLOTS]: DEFAULT_NB_ITEMS_PER_ROW
}

export const DEFAULT_HEIGHT = {
  [PlotsSection.CHECKPOINT_PLOTS]: DEFAULT_PLOT_HEIGHT,
  [PlotsSection.TEMPLATE_PLOTS]: DEFAULT_PLOT_HEIGHT,
  [PlotsSection.COMPARISON_TABLE]: DEFAULT_PLOT_HEIGHT,
  [PlotsSection.CUSTOM_PLOTS]: DEFAULT_PLOT_HEIGHT
}

export const DEFAULT_SECTION_COLLAPSED = {
  [PlotsSection.CHECKPOINT_PLOTS]: false,
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
  width: number | undefined
  height: PlotHeight
  revisions: Revision[]
}

export type CheckpointPlotValues = {
  group: string
  iteration: number
  y: number
}[]

export type ColorScale = { domain: string[]; range: Color[] }

export type CheckpointPlot = {
  id: string
  values: CheckpointPlotValues
}

export type CustomPlotValues = {
  expName: string
  metric: number
  param: number
}

export type CustomPlotData = {
  id: string
  values: CustomPlotValues[]
  metric: string
  param: string
}

export type CustomPlotsData = {
  plots: CustomPlotData[]
  nbItemsPerRow: number | undefined
  height: PlotHeight
}

export type CheckpointPlotData = CheckpointPlot & { title: string }

export type CheckpointPlotsData = {
  plots: CheckpointPlotData[]
  colors: ColorScale
  nbItemsPerRow: number | undefined
  height: PlotHeight
  selectedMetrics?: string[]
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
  nbItemsPerRow: number | undefined
  height: PlotHeight
}

export type ComparisonPlot = {
  url?: string
  revision: string
}

export enum PlotsDataKeys {
  COMPARISON = 'comparison',
  CHECKPOINT = 'checkpoint',
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
      [PlotsDataKeys.CHECKPOINT]?: CheckpointPlotsData | null
      [PlotsDataKeys.CUSTOM]?: CustomPlotsData | null
      [PlotsDataKeys.HAS_PLOTS]?: boolean
      [PlotsDataKeys.HAS_UNSELECTED_PLOTS]?: boolean
      [PlotsDataKeys.SELECTED_REVISIONS]?: Revision[]
      [PlotsDataKeys.TEMPLATE]?: TemplatePlotsData | null
      [PlotsDataKeys.SECTION_COLLAPSED]?: SectionCollapsed
    }
  | undefined
