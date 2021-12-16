import { ExperimentFields, ValueTreeRoot } from '../../cli/reader'
import { MetricsOrParams } from '../webview/contract'

const reduceMetricsOrParams = (metricsOrParams?: ValueTreeRoot) => {
  if (metricsOrParams) {
    return Object.entries(metricsOrParams).reduce(
      (metricsOrParams, [file, dataOrError]) => {
        const data = dataOrError?.data
        if (data) {
          metricsOrParams[file] = data
        }
        return metricsOrParams
      },
      {} as MetricsOrParams
    )
  }
}

export const reduceMetricsAndParams = (
  experiment: ExperimentFields
): {
  metrics: MetricsOrParams | undefined
  params: MetricsOrParams | undefined
} => ({
  metrics: reduceMetricsOrParams(experiment.metrics),
  params: reduceMetricsOrParams(experiment.params)
})
