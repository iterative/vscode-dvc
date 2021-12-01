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
}

export enum PlotsType {
  VEGA = 'vega',
  IMAGE = 'image'
}

export type StaticVegaPlot = {
  content: VisualizationSpec
  type: PlotsType
  revs?: string[]
}

export type StaticImage = {
  content: { url: string }
  type: PlotsType
  rev?: string
}

export type StaticPlot = StaticVegaPlot | StaticImage

export type PlotsOutput = Record<string, (StaticVegaPlot | StaticImage)[]>

export type PlotsData = {
  live: LivePlotsData | undefined
  static: PlotsOutput | undefined
}
