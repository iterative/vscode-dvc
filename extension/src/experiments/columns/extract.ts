import {
  Deps,
  ExperimentFields,
  ValueTreeOrError,
  ValueTreeRoot
} from '../../cli/dvc/reader'
import { shortenForLabel } from '../../util/string'
import {
  DepColumns,
  Experiment,
  MetricOrParamColumns
} from '../webview/contract'

const extractFileMetricsOrParams = (
  acc: { columns: MetricOrParamColumns; errors: string[] },
  file: string,
  dataOrError: ValueTreeOrError
) => {
  const data = dataOrError?.data
  const error = dataOrError?.error?.msg
  if (error) {
    acc.errors.push(error)
  }
  if (!data) {
    return
  }
  acc.columns[file] = data
}

const extractMetricsOrParams = (
  valueTreeRoot?: ValueTreeRoot
): { columns: MetricOrParamColumns; errors: string[] } | undefined => {
  if (!valueTreeRoot) {
    return
  }
  const acc: { columns: MetricOrParamColumns; errors: string[] } = {
    columns: {},
    errors: []
  }

  for (const [file, dataOrError] of Object.entries(valueTreeRoot)) {
    extractFileMetricsOrParams(acc, file, dataOrError)
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
    const value = shortenForLabel<string | null>(hash)
    if (value) {
      acc[path] = {
        changes: !!branch && branch?.deps?.[path]?.value !== value,
        value
      }
    }
  }

  return acc
}

type Columns = {
  error?: string
  deps: DepColumns | undefined
  metrics: MetricOrParamColumns | undefined
  params: MetricOrParamColumns | undefined
  Created: string | null | undefined
}

export const extractColumns = (
  experiment: ExperimentFields,
  branch?: Experiment
): Columns => {
  const metricsData = extractMetricsOrParams(experiment.metrics)
  const paramsData = extractMetricsOrParams(experiment.params)

  const error = [
    ...(metricsData?.errors || []),
    ...(paramsData?.errors || [])
  ].join('\n')

  const columns: Columns = {
    Created: experiment?.timestamp,
    deps: extractDeps(experiment.deps, branch),
    metrics: metricsData?.columns,
    params: paramsData?.columns
  }

  if (error) {
    columns.error = error
  }

  return columns
}
