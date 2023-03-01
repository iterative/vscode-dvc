import { VisualizationSpec } from 'react-vega'
import { Color } from '../../experiments/model/status/colors'

// It is easier to keep the numerical order than the alphabetical one
/* eslint-disable sort-keys-fix/sort-keys-fix */
export const PlotNumberOfItemsPerRow = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4
}
/* eslint-enable sort-keys-fix/sort-keys-fix */

export enum Section {
  CHECKPOINT_PLOTS = 'checkpoint-plots',
  TEMPLATE_PLOTS = 'template-plots',
  COMPARISON_TABLE = 'comparison-table',
  CUSTOM_PLOTS = 'custom-plots'
}

export const DEFAULT_SECTION_NB_ITEMS_PER_ROW = {
  [Section.CHECKPOINT_PLOTS]: PlotNumberOfItemsPerRow.TWO,
  [Section.TEMPLATE_PLOTS]: PlotNumberOfItemsPerRow.TWO,
  [Section.COMPARISON_TABLE]: PlotNumberOfItemsPerRow.TWO,
  [Section.CUSTOM_PLOTS]: PlotNumberOfItemsPerRow.TWO
}

export const DEFAULT_SECTION_COLLAPSED = {
  [Section.CHECKPOINT_PLOTS]: false,
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
  nbItemsPerRow: number
}

export type CheckpointPlotData = CheckpointPlot & { title: string }

export type CheckpointPlotsData = {
  plots: CheckpointPlotData[]
  colors: ColorScale
  nbItemsPerRow: number
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
  nbItemsPerRow: number
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
