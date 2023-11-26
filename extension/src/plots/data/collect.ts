import {
  PLOT_DATA_ANCHOR,
  isImagePlotOutput,
  PlotOutput,
  PlotsOutputOrError,
  TemplatePlotOutput
} from '../../cli/dvc/contract'
import { isDvcError } from '../../cli/dvc/reader'
import { uniqueValues } from '../../util/array'

const collectImageFile = (acc: string[], file: string): void => {
  if (acc.includes(file)) {
    return
  }
  acc.push(file)
}

const collectFromDatapoint = (
  acc: string[],
  data: Record<string, unknown>
): void => {
  const filename = data.filename

  if (!filename || typeof filename !== 'string' || acc.includes(filename)) {
    return
  }
  acc.push(filename)
}

const collectTemplateFiles = (
  acc: string[],
  plot: TemplatePlotOutput
): void => {
  for (const datapoint of plot.anchor_definitions[PLOT_DATA_ANCHOR] || []) {
    collectFromDatapoint(acc, datapoint)
  }
}

const collectKeyData = (
  acc: string[],
  key: string,
  plots: PlotOutput[]
): void => {
  for (const plot of plots) {
    if (isImagePlotOutput(plot)) {
      collectImageFile(acc, key)
      continue
    }
    collectTemplateFiles(acc, plot)
  }
}

export const collectFiles = (
  output: PlotsOutputOrError,
  collectedFiles: string[]
): string[] => {
  const acc = [...collectedFiles]
  if (isDvcError(output)) {
    return acc
  }

  const { data } = output

  for (const [key, plots] of Object.entries(data)) {
    collectKeyData(acc, key, plots)
  }

  return uniqueValues(acc)
}
