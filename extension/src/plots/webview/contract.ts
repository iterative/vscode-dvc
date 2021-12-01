import { PlotsOutput } from '../../cli/reader'

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

export type PlotsData = {
  live: LivePlotsData | undefined
  static: PlotsOutput | undefined
}
