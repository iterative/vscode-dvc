import { VisualizationSpec } from 'react-vega'

export const PlotSize = {
  LARGE: 'LARGE',
  REGULAR: 'REGULAR',
  SMALL: 'SMALL'
}

type PlotSizeKeys = keyof typeof PlotSize
export type PlotSize = typeof PlotSize[PlotSizeKeys]

export enum Section {
  CHECKPOINT_PLOTS = 'checkpoint-plots',
  PLOTS = 'plots',
  COMPARISON_TABLE = 'comparison-table'
}

export const DEFAULT_SECTION_NAMES = {
  [Section.CHECKPOINT_PLOTS]: 'Experiment Checkpoints',
  [Section.PLOTS]: 'Plots',
  [Section.COMPARISON_TABLE]: 'Comparison'
}

export const DEFAULT_SECTION_SIZES = {
  [Section.CHECKPOINT_PLOTS]: PlotSize.REGULAR,
  [Section.PLOTS]: PlotSize.REGULAR,
  [Section.COMPARISON_TABLE]: PlotSize.REGULAR
}

export const DEFAULT_SECTION_COLLAPSED = {
  [Section.CHECKPOINT_PLOTS]: false,
  [Section.PLOTS]: false,
  [Section.COMPARISON_TABLE]: false
}

export type SectionCollapsed = typeof DEFAULT_SECTION_COLLAPSED

export type ComparisonRevisionData = { [revision: string]: ComparisonPlot }

export type ComparisonPlots = {
  path: string
  revisions: ComparisonRevisionData
}[]

export type ComparisonRevision = { revision: string; displayColor: string }

export type PlotsComparisonData = {
  revisions: ComparisonRevision[]
  plots: ComparisonPlots
  sectionName: string
  size: PlotSize
}

export type CheckpointPlotValues = {
  group: string
  iteration: number
  y: number
}[]

export type CheckpointPlotColors = { domain: string[]; range: string[] }

export type CheckpointPlotData = {
  title: string
  values: CheckpointPlotValues
}

export type CheckpointPlotsData = {
  plots: CheckpointPlotData[]
  colors: CheckpointPlotColors
  size: PlotSize
  sectionName: string
  selectedMetrics?: string[]
}

export enum PlotsType {
  VEGA = 'vega',
  IMAGE = 'image'
}

export const isVegaPlot = (plot: Plot): plot is VegaPlot =>
  plot.type === PlotsType.VEGA

export type VegaPlot = {
  content: VisualizationSpec
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

export type Plot = VegaPlot | ImagePlot

export type VegaPlots = { [path: string]: VegaPlot[] }

export type PlotsData = {
  plots: VegaPlots
  sectionName: string
  size: PlotSize
}

export type ComparisonPlot = {
  url: string
  revision: string
}

export type CombinedPlotsData =
  | {
      comparison?: PlotsComparisonData | null
      checkpoints?: CheckpointPlotsData | null
      plots?: PlotsData | null
      sectionCollapsed?: SectionCollapsed
    }
  | undefined
