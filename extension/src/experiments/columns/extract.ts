import { ExperimentFields, ValueTreeRoot } from '../../cli/reader'
import { Columns } from '../webview/contract'

const extractMetricsOrParams = (
  columns?: ValueTreeRoot
): Columns | undefined => {
  if (!columns) {
    return
  }
  const acc: Columns = {}

  for (const [file, dataOrError] of Object.entries(columns)) {
    const data = dataOrError?.data
    if (!data) {
      continue
    }
    acc[file] = data
  }

  return acc
}

export const extractColumns = (
  experiment: ExperimentFields
): {
  metrics: Columns | undefined
  params: Columns | undefined
} => ({
  metrics: extractMetricsOrParams(experiment.metrics),
  params: extractMetricsOrParams(experiment.params)
})
