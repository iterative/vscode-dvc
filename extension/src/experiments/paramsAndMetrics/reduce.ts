import { ExperimentFields, ValueTreeRoot } from '../../cli/reader'
import { ParamsOrMetrics } from '../webview/contract'

const reduceParamsOrMetrics = (paramsOrMetrics?: ValueTreeRoot) => {
  if (paramsOrMetrics) {
    return Object.entries(paramsOrMetrics).reduce(
      (paramsOrMetrics, [file, dataOrError]) => {
        const data = dataOrError?.data
        if (data) {
          paramsOrMetrics[file] = data
        }
        return paramsOrMetrics
      },
      {} as ParamsOrMetrics
    )
  }
}

export const reduceParamsAndMetrics = (
  experiment: ExperimentFields
): {
  metrics: ParamsOrMetrics | undefined
  params: ParamsOrMetrics | undefined
} => ({
  metrics: reduceParamsOrMetrics(experiment.metrics),
  params: reduceParamsOrMetrics(experiment.params)
})
