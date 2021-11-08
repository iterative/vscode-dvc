import { PlotsOutput } from '../../cli/reader'

export type LivePlotValues = { group: string; x: number; y: number }[]

export type LivePlotsColors = { domain: string[]; range: string[] }

export type LivePlotData = {
  title: string
  values: LivePlotValues
}

export type PlotsData = {
  live: {
    plots: LivePlotData[]
    colors?: LivePlotsColors
  }
  static: PlotsOutput
}
