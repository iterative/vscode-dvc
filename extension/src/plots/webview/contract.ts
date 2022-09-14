import { VisualizationSpec } from 'react-vega'
import { Color } from '../../experiments/model/status/colors'

export const PlotSize = {
  LARGE: 'LARGE',
  REGULAR: 'REGULAR',
  SMALL: 'SMALL'
}

type PlotSizeKeys = keyof typeof PlotSize
export type PlotSize = typeof PlotSize[PlotSizeKeys]

export enum Section {
  CHECKPOINT_PLOTS = 'checkpoint-plots',
  TEMPLATE_PLOTS = 'template-plots',
  COMPARISON_TABLE = 'comparison-table'
}

export const DEFAULT_SECTION_SIZES = {
  [Section.CHECKPOINT_PLOTS]: PlotSize.REGULAR,
  [Section.TEMPLATE_PLOTS]: PlotSize.REGULAR,
  [Section.COMPARISON_TABLE]: PlotSize.REGULAR
}

export const DEFAULT_SECTION_COLLAPSED = {
  [Section.CHECKPOINT_PLOTS]: false,
  [Section.TEMPLATE_PLOTS]: false,
  [Section.COMPARISON_TABLE]: false
}

export type SectionCollapsed = typeof DEFAULT_SECTION_COLLAPSED

export type ComparisonRevisionData = { [revision: string]: ComparisonPlot }

export type ComparisonPlots = {
  path: string
  revisions: ComparisonRevisionData
}[]

export type Revision = {
  id?: string
  revision: string
  group?: string
  displayColor: Color
}

export interface PlotsComparisonData {
  plots: ComparisonPlots
  size: PlotSize
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

export type CheckpointPlotData = CheckpointPlot & { title: string }

export type CheckpointPlotsData = {
  plots: CheckpointPlotData[]
  colors: ColorScale
  size: PlotSize
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
  size: PlotSize
}

export type ComparisonPlot = {
  url: string | undefined
  revision: string
}

export enum PlotsDataKeys {
  COMPARISON = 'comparison',
  CHECKPOINT = 'checkpoint',
  HAS_PLOTS = 'hasPlots',
  HAS_SELECTED_PLOTS = 'hasSelectedPlots',
  SELECTED_REVISIONS = 'selectedRevisions',
  TEMPLATE = 'template',
  SECTION_COLLAPSED = 'sectionCollapsed'
}

export type PlotsData =
  | {
      [PlotsDataKeys.COMPARISON]?: PlotsComparisonData | null
      [PlotsDataKeys.CHECKPOINT]?: CheckpointPlotsData | null
      [PlotsDataKeys.HAS_PLOTS]?: boolean
      [PlotsDataKeys.HAS_SELECTED_PLOTS]?: boolean
      [PlotsDataKeys.SELECTED_REVISIONS]?: Revision[]
      [PlotsDataKeys.TEMPLATE]?: TemplatePlotsData | null
      [PlotsDataKeys.SECTION_COLLAPSED]?: SectionCollapsed
    }
  | undefined
