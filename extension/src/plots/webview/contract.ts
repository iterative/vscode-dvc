import { VisualizationSpec } from 'react-vega'

export type LivePlotValues = { group: string; x: number; y: number }[]

export type LivePlotsColors = { domain: string[]; range: string[] }

export type LivePlotData = {
  title: string
  values: LivePlotValues
}

export type LivePlotsData = {
  plots: LivePlotData[]
  colors: LivePlotsColors
  selectedMetrics?: string[]
}

export enum PlotsType {
  VEGA = 'vega',
  IMAGE = 'image'
}

export type VegaPlot = {
  content: VisualizationSpec
  revs?: string[]
  type: PlotsType
}

export type ImagePlot = {
  rev?: string
  type: PlotsType
  url: string
}

export type StaticPlot = VegaPlot | ImagePlot

export type PlotsOutput = Record<string, StaticPlot[]>

export type PlotsData = {
  live: LivePlotsData | undefined
  static: PlotsOutput | undefined
}
