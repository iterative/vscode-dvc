import { set } from 'lodash'
import {
  ExperimentFields,
  OutsOrDepsDetails,
  ValueTreeRoot
} from '../../cli/reader'
import { Columns, ColumnType } from '../webview/contract'

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

const extractOutsOrDepsDetails = (
  details: OutsOrDepsDetails | undefined,
  key: ColumnType
) => {
  if (!details) {
    return undefined
  }

  const detailsTree = {}

  for (const [file, value] of Object.entries(details)) {
    const paths = file.split('/')
    set(detailsTree, paths, value.hash)
  }

  return { [key]: detailsTree }
}

export const extractColumns = (
  experiment: ExperimentFields
): {
  metrics: Columns | undefined
  params: Columns | undefined
  deps: Columns | undefined
} => ({
  deps: extractOutsOrDepsDetails(experiment.deps, ColumnType.DEPS),
  metrics: extractMetricsOrParams(experiment.metrics),
  params: extractMetricsOrParams(experiment.params)
})
