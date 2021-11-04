import { PlotsOutput } from '../../cli/reader'

export type LivePlotValues = { group: string; x: number; y: number }[]

export type LivePlotData = {
  title: string
  values: LivePlotValues
}

export type PlotsData = { live: LivePlotData[]; static: PlotsOutput }
