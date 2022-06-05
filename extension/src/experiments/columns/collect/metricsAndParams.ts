import get from 'lodash.get'
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
  ValueTreeOrError,
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

const collectChange = (
  changes: string[],
  type: ColumnType,
  file: string,
  key: string,
  value: Value | ValueTree,
  commitData: ExperimentFields,
  ancestors: string[] = []
) => {
  if (typeof value === 'object') {
    for (const [childKey, childValue] of Object.entries(value as ValueTree)) {
      collectChange(changes, type, file, childKey, childValue, commitData, [
        ...ancestors,
        key
      ])
    }
    return
  }

  if (get(commitData?.[type], [file, 'data', ...ancestors, key]) !== value) {
    changes.push(joinColumnPath(type, file, ...ancestors, key))
  }
}

const collectFileChanges = (
  changes: string[],
  type: ColumnType,
  commitData: ExperimentFields,
  file: string,
  value: ValueTreeOrError
) => {
  const data = value.data
  if (!data) {
    return
  }

  for (const [key, value] of Object.entries(data)) {
    collectChange(changes, type, file, key, value, commitData)
  }
}

export const collectMetricAndParamChanges = (
  changes: string[],
  workspaceData: ExperimentFields,
  commitData: ExperimentFields
) => {
  for (const type of [ColumnType.METRICS, ColumnType.PARAMS]) {
    for (const [file, value] of Object.entries(workspaceData?.[type] || {})) {
      collectFileChanges(changes, type, commitData, file, value)
    }
  }
}
