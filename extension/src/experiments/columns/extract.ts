import {
  Deps,
  ExpData,
  FileDataOrError,
  MetricsOrParams,
  fileHasError
} from '../../cli/dvc/contract'
import { shortenForLabel } from '../../util/string'
import {
  DepColumns,
  Experiment,
  MetricOrParamColumns
} from '../webview/contract'

const extractFileMetricsOrParams = (
  acc: { columns: MetricOrParamColumns; errors: string[] },
  file: string,
  dataOrError: FileDataOrError
) => {
  if (fileHasError(dataOrError)) {
    const error = dataOrError?.error?.msg
    if (error) {
      acc.errors.push(error)
    }
    return
  }
  const data = dataOrError?.data
  if (!data) {
    return
  }
  acc.columns[file] = data
}

const extractMetricsOrParams = (
  metricsOrParams?: MetricsOrParams | null
): { columns: MetricOrParamColumns; errors: string[] } | undefined => {
  if (!metricsOrParams) {
    return
  }
  const acc: { columns: MetricOrParamColumns; errors: string[] } = {
    columns: {},
    errors: []
  }

  for (const [file, dataOrError] of Object.entries(metricsOrParams)) {
    extractFileMetricsOrParams(acc, file, dataOrError)
  }

  return acc
}

const extractDeps = (
  columns: Deps | null,
  commit?: Experiment
): DepColumns | undefined => {
  if (!columns) {
    return
  }

  const acc: DepColumns = {}

  for (const [path, { hash }] of Object.entries(columns)) {
    const value = shortenForLabel<string | null>(hash)
    if (value) {
      acc[path] = {
        changes: !!commit && commit?.deps?.[path]?.value !== value,
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
  experiment: ExpData,
  commit?: Experiment
): Columns => {
  const metricsData = extractMetricsOrParams(experiment.metrics)
  const paramsData = extractMetricsOrParams(experiment.params)

  const error = [
    ...(metricsData?.errors || []),
    ...(paramsData?.errors || [])
  ].join('\n')

  const columns: Columns = {
    Created: experiment?.timestamp,
    deps: extractDeps(experiment.deps, commit),
    metrics: metricsData?.columns,
    params: paramsData?.columns
  }

  if (error) {
    columns.error = error
  }

  return columns
}
