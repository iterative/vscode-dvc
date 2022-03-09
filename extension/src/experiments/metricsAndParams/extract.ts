import { ExperimentFields, ValueTreeRoot } from '../../cli/reader'
import { MetricsOrParams } from '../webview/contract'

const extractMetricsOrParams = (
  metricsOrParams?: ValueTreeRoot
): MetricsOrParams | undefined => {
  if (!metricsOrParams) {
    return
  }
  const acc: MetricsOrParams = {}

  Object.entries(metricsOrParams).forEach(([file, dataOrError]) => {
    const data = dataOrError?.data
    if (!data) {
      return
    }
    acc[file] = data
  })

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
