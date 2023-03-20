import {
  EXPERIMENT_WORKSPACE_ID,
  ExperimentsOutput,
  PlotsOutputOrError
} from '../../cli/dvc/contract'
import { isDvcError } from '../../cli/dvc/reader'
import { uniqueValues } from '../../util/array'
import { isImagePlot, Plot, TemplatePlot } from '../webview/contract'

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
  const filename = (data as { dvc_data_version_info?: { filename?: string } })
    ?.dvc_data_version_info?.filename

  if (!filename || acc.includes(filename)) {
    return
  }
  acc.push(filename)
}

const collectTemplateFiles = (acc: string[], plot: TemplatePlot): void => {
  for (const datapoints of Object.values(plot.datapoints || {})) {
    for (const datapoint of datapoints) {
      collectFromDatapoint(acc, datapoint)
    }
  }
}

const collectKeyData = (acc: string[], key: string, plots: Plot[]): void => {
  for (const plot of plots) {
    if (isImagePlot(plot)) {
      collectImageFile(acc, key)
      continue
    }
    collectTemplateFiles(acc, plot)
  }
}

export const collectFiles = (
  data: PlotsOutputOrError,
  collectedFiles: string[]
): string[] => {
  const acc = [...collectedFiles]
  if (isDvcError(data)) {
    return acc
  }

  for (const [key, plots] of Object.entries(data)) {
    collectKeyData(acc, key, plots)
  }

  return uniqueValues(acc)
}

export const collectMetricsFiles = (
  data: ExperimentsOutput,
  existingFiles: string[]
): string[] =>
  uniqueValues([
    ...Object.keys({
      ...data?.workspace?.baseline?.data?.metrics
    }).filter(Boolean),
    ...existingFiles
  ]).sort()

const collectRev = (acc: string[], rev: string): void => {
  if (rev !== EXPERIMENT_WORKSPACE_ID && !acc.includes(rev)) {
    acc.push(rev)
  }
}

export const collectRevs = (
  missingRevisions: string[],
  mutableRevisions: string[]
): string[] => {
  const acc: string[] = []

  for (const missingRevision of missingRevisions) {
    collectRev(acc, missingRevision)
  }

  for (const mutableRevision of mutableRevisions) {
    collectRev(acc, mutableRevision)
  }

  return [EXPERIMENT_WORKSPACE_ID, ...acc.sort()]
}
