import { ExperimentFields, ValueTreeRoot } from '../../cli/reader'
import { MetricsOrParams } from '../webview/contract'

const extractMetricsOrParams = (
  metricsOrParams?: ValueTreeRoot
): MetricsOrParams | undefined => {
  if (!metricsOrParams) {
    return
  }
  const acc: MetricsOrParams = {}

  for (const [file, dataOrError] of Object.entries(metricsOrParams)) {
    const data = dataOrError?.data
    if (!data) {
      continue
    }
    acc[file] = data
  }

  return acc
}

export const extractMetricsAndParams = (
  experiment: ExperimentFields
): {
  metrics: MetricsOrParams | undefined
  params: MetricsOrParams | undefined
} => ({
  metrics: extractMetricsOrParams(experiment.metrics),
  params: extractMetricsOrParams(experiment.params)
})
