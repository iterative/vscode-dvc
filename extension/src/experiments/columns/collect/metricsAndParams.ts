import {
  ColumnAccumulator,
  limitAncestorDepth,
  mergeAncestors,
  mergeValueColumn
} from './util'
import { ColumnType } from '../../webview/contract'
import {
  ExperimentFields,
  Value,
  ValueTree,
  ValueTreeRoot
} from '../../../cli/reader'
import { joinColumnPath, METRIC_PARAM_SEPARATOR } from '../paths'

const collectMetricOrParam = (
  acc: ColumnAccumulator,
  name: string,
  value: Value,
  type: ColumnType,
  pathArray: string[]
) => {
  const limitedDepthAncestors = limitAncestorDepth(
    pathArray,
    METRIC_PARAM_SEPARATOR
  )
  const path = joinColumnPath(type, ...limitedDepthAncestors, name)
  mergeAncestors(
    acc,
    path,
    limitedDepthAncestors,
    (...pathArray: string[]) => joinColumnPath(type, ...pathArray),
    type
  )

  mergeValueColumn(
    acc,
    name,
    value,
    type,
    [type, ...pathArray, name],
    joinColumnPath(type, ...limitedDepthAncestors, name),
    joinColumnPath(type, ...limitedDepthAncestors)
  )
}

const walkValueTree = (
  acc: ColumnAccumulator,
  tree: ValueTree,
  type: ColumnType,
  ancestors: string[] = []
) => {
  for (const [key, value] of Object.entries(tree)) {
    if (value && !Array.isArray(value) && typeof value === 'object') {
      walkValueTree(acc, value, type, [...ancestors, key])
    } else {
      collectMetricOrParam(acc, key, value, type, ancestors)
    }
  }
}

export const walkValueFileRoot = (
  acc: ColumnAccumulator,
  root: ValueTreeRoot,
  type: ColumnType
) => {
  for (const [file, value] of Object.entries(root)) {
    const { data } = value
    if (data) {
      walkValueTree(acc, data, type, [file])
    }
  }
}

export const collectMetricsAndParams = (
  acc: ColumnAccumulator,
  data: ExperimentFields
) => {
  const { metrics, params } = data
  if (metrics) {
    walkValueFileRoot(acc, metrics, ColumnType.METRICS)
  }
  if (params) {
    walkValueFileRoot(acc, params, ColumnType.PARAMS)
  }
}
