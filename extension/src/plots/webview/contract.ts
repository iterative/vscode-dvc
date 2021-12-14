import { VisualizationSpec } from 'react-vega'

export type LivePlotValues = { group: string; iteration: number; y: number }[]

export type LivePlotsColors = { domain: string[]; range: string[] }

export const PlotSize = {
  LARGE: 'LARGE',
  REGULAR: 'REGULAR',
  SMALL: 'SMALL'
}

type PlotSizeKeys = keyof typeof PlotSize
export type PlotSize = typeof PlotSize[PlotSizeKeys]

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
}

export type ImagePlot = {
  revisions?: string[]
  type: PlotsType
  url: string
}

export const isImagePlot = (plot: StaticPlot): plot is ImagePlot =>
  plot.type === PlotsType.IMAGE

export type StaticPlot = VegaPlot | ImagePlot

export type PlotsOutput = Record<string, StaticPlot[]>

export interface StaticPlotsData {
  plots: PlotsOutput
  sectionName: string
}

export enum Section {
  LIVE_PLOTS = 'live-plots',
  STATIC_PLOTS = 'static-plots'
}

export const defaultSectionCollapsed = {
  [Section.LIVE_PLOTS]: false,
  [Section.STATIC_PLOTS]: false
}

export type SectionCollapsed = typeof defaultSectionCollapsed

export type PlotsData =
  | {
      live?: LivePlotsData | null
      static?: StaticPlotsData | null
      sectionCollapsed?: SectionCollapsed
    }
  | undefined
