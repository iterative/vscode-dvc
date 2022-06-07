import { Deps, ExperimentFields, ValueTreeRoot } from '../../cli/reader'
import { shortenForLabel } from '../../util/string'
import { DepColumns, MetricOrParamColumns } from '../webview/contract'

const extractMetricsOrParams = (
  columns?: ValueTreeRoot
): MetricOrParamColumns | undefined => {
  if (!columns) {
    return
  }
  const acc: MetricOrParamColumns = {}

  for (const [file, dataOrError] of Object.entries(columns)) {
    const data = dataOrError?.data
    if (!data) {
      continue
    }
    acc[file] = data
  }

  return acc
}

const extractDeps = (columns?: Deps): DepColumns | undefined => {
  if (!columns) {
    return
  }

  const acc: DepColumns = {}

  for (const [path, { hash }] of Object.entries(columns)) {
    acc[path] = shortenForLabel(hash)
  }

  return acc
}

export const extractColumns = (
  experiment: ExperimentFields
): {
  deps: DepColumns | undefined
  metrics: MetricOrParamColumns | undefined
  params: MetricOrParamColumns | undefined
} => ({
  deps: extractDeps(experiment.deps),
  metrics: extractMetricsOrParams(experiment.metrics),
  params: extractMetricsOrParams(experiment.params)
})
