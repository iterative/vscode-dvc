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
  ValueTreeNode,
  ValueTreeOrError,
  ValueTreeRoot
} from '../../../cli/reader'
import { buildMetricOrParamPath, METRIC_PARAM_SEPARATOR } from '../paths'

const collectMetricOrParam = (
  acc: ColumnAccumulator,
  type: ColumnType,
  pathArray: string[],
  label: string,
  value: Value
) => {
  const limitedDepthAncestors = limitAncestorDepth(
    pathArray,
    METRIC_PARAM_SEPARATOR
  )
  const path = buildMetricOrParamPath(type, ...limitedDepthAncestors, label)
  mergeAncestors(
    acc,
    type,
    path,
    limitedDepthAncestors,
    (...pathArray: string[]) => buildMetricOrParamPath(type, ...pathArray)
  )

  mergeValueColumn(
    acc,
    buildMetricOrParamPath(type, ...limitedDepthAncestors, label),
    buildMetricOrParamPath(type, ...limitedDepthAncestors),
    [type, ...pathArray, label],
    label,
    value
  )
}

const notLeaf = (value: ValueTreeNode): boolean =>
  value && !Array.isArray(value) && typeof value === 'object'

const walkValueTree = (
  acc: ColumnAccumulator,
  type: ColumnType,
  tree: ValueTree,
  ancestors: string[] = []
) => {
  for (const [label, value] of Object.entries(tree)) {
    if (notLeaf(value)) {
      walkValueTree(acc, type, value, [...ancestors, label])
    } else {
      collectMetricOrParam(acc, type, ancestors, label, value)
    }
  }
}

export const walkValueFileRoot = (
  acc: ColumnAccumulator,
  type: ColumnType,
  root: ValueTreeRoot
) => {
  for (const [file, value] of Object.entries(root)) {
    const { data } = value
    if (data) {
      walkValueTree(acc, type, data, [file])
    }
  }
}

export const collectMetricsAndParams = (
  acc: ColumnAccumulator,
  data: ExperimentFields
) => {
  const { metrics, params } = data
  if (metrics) {
    walkValueFileRoot(acc, ColumnType.METRICS, metrics)
  }
  if (params) {
    walkValueFileRoot(acc, ColumnType.PARAMS, params)
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
    changes.push(buildMetricOrParamPath(type, file, ...ancestors, key))
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
