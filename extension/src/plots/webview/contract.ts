import { VisualizationSpec } from 'react-vega'

export const PlotSize = {
  LARGE: 'LARGE',
  REGULAR: 'REGULAR',
  SMALL: 'SMALL'
}

type PlotSizeKeys = keyof typeof PlotSize
export type PlotSize = typeof PlotSize[PlotSizeKeys]

export enum Section {
  LIVE_PLOTS = 'live-plots',
  STATIC_PLOTS = 'static-plots',
  COMPARISON_TABLE = 'comparison-table'
}

export const DEFAULT_SECTION_NAMES = {
  [Section.LIVE_PLOTS]: 'Live Experiments Plots',
  [Section.STATIC_PLOTS]: 'Static Plots',
  [Section.COMPARISON_TABLE]: 'Comparison'
}

export const DEFAULT_SECTION_SIZES = {
  [Section.LIVE_PLOTS]: PlotSize.REGULAR,
  [Section.STATIC_PLOTS]: PlotSize.REGULAR,
  [Section.COMPARISON_TABLE]: PlotSize.REGULAR
}

export const DEFAULT_SECTION_COLLAPSED = {
  [Section.LIVE_PLOTS]: false,
  [Section.STATIC_PLOTS]: false,
  [Section.COMPARISON_TABLE]: false
}

export type SectionCollapsed = typeof DEFAULT_SECTION_COLLAPSED

export type LivePlotValues = { group: string; iteration: number; y: number }[]

export type LivePlotsColors = { domain: string[]; range: string[] }

export type LivePlotData = {
  title: string
  values: LivePlotValues
}

export type LivePlotsData = {
  plots: LivePlotData[]
  colors: LivePlotsColors
  size: PlotSize
  sectionName: string
  selectedMetrics?: string[]
}

export enum PlotsType {
  VEGA = 'vega',
  IMAGE = 'image'
}

export const isVegaPlot = (plot: StaticPlot): plot is VegaPlot =>
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

export const isImagePlot = (plot: StaticPlot): plot is ImagePlot =>
  plot.type === PlotsType.IMAGE

export type StaticPlot = VegaPlot | ImagePlot

export interface PlotsComparisonData {
  revisions: ComparisonRevisions
  plots: ComparisonPlots
  sectionName: string
  size: PlotSize
}

export type PlotsOutput = Record<string, StaticPlot[]>

export type VegaPlots = { [path: string]: VegaPlot[] }

export interface StaticPlotsData {
  plots: VegaPlots
  sectionName: string
  size: PlotSize
}

export type PlotsData =
  | {
      live?: LivePlotsData | null
      static?: StaticPlotsData | null
      sectionCollapsed?: SectionCollapsed
      comparison?: PlotsComparisonData | null
    }
  | undefined

export type ComparisonPlot = {
  url: string
  revision: string
}

export type ComparisonRevisionData = { [revision: string]: ComparisonPlot }

export type ComparisonPlots = {
  path: string
  revisions: ComparisonRevisionData
}[]

export type ComparisonRevisions = {
  [revision: string]: { color: string }
}
