import { Deps, ExperimentFields, ValueTreeRoot } from '../../cli/reader'
import { shortenForLabel } from '../../util/string'
import {
  DepColumns,
  Experiment,
  MetricOrParamColumns
} from '../webview/contract'

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

const extractDeps = (
  columns?: Deps,
  branch?: Experiment
): DepColumns | undefined => {
  if (!columns) {
    return
  }

  const acc: DepColumns = {}

  for (const [path, { hash }] of Object.entries(columns)) {
    const value = shortenForLabel(hash)
    acc[path] = {
      changes: !!value && !!branch && branch?.deps?.[path].value !== value,
      value
    }
  }

  return acc
}

export const extractColumns = (
  experiment: ExperimentFields,
  branch?: Experiment
): {
  deps: DepColumns | undefined
  metrics: MetricOrParamColumns | undefined
  params: MetricOrParamColumns | undefined
} => ({
  deps: extractDeps(experiment.deps, branch),
  metrics: extractMetricsOrParams(experiment.metrics),
  params: extractMetricsOrParams(experiment.params)
})
