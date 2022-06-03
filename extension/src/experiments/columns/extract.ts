import { sep } from 'path'
import set from 'lodash.set'
import { Deps, ExperimentFields, ValueTreeRoot } from '../../cli/reader'
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

const extractDeps = (columns?: Deps): Columns | undefined => {
  if (!columns) {
    return
  }

  const acc = {}

  for (const [file, { hash }] of Object.entries(columns)) {
    set(acc, [...file.split(sep)], hash)
  }

  return acc
}

export const extractColumns = (
  experiment: ExperimentFields
): {
  deps: Columns | undefined
  metrics: Columns | undefined
  params: Columns | undefined
} => ({
  deps: extractDeps(experiment.deps),
  metrics: extractMetricsOrParams(experiment.metrics),
  params: extractMetricsOrParams(experiment.params)
})
