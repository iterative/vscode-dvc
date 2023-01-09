import get from 'lodash.get'
import isEqual from 'lodash.isequal'
import {
  ColumnAccumulator,
  limitAncestorDepth,
  mergeAncestors,
  mergeValueColumn
} from './util'
import { ColumnType } from '../../webview/contract'
import {
  ExperimentFields,
  isValueTree,
  Value,
  ValueTree,
  ValueTreeOrError,
  ValueTreeRoot
} from '../../../cli/dvc/contract'
import {
  buildMetricOrParamPath,
  FILE_SEPARATOR,
  METRIC_PARAM_SEPARATOR
} from '../paths'

export const typedEntries = (value: NonNullable<ValueTree>) =>
  Object.entries(value) as [string, Value | ValueTree][]

const collectMetricOrParam = (
  acc: ColumnAccumulator,
  type: ColumnType,
  pathArray: string[],
  label: string,
  value: Value
) => {
  const { limitedDepthAncestors, limitedDepthLabel } = limitAncestorDepth(
    pathArray,
    METRIC_PARAM_SEPARATOR,
    FILE_SEPARATOR,
    label
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
    buildMetricOrParamPath(
      type,
      ...(limitedDepthAncestors || pathArray),
      label
    ),
    buildMetricOrParamPath(type, ...limitedDepthAncestors),
    [type, ...pathArray, label],
    limitedDepthLabel,
    value
  )
}

const walkValueTree = (
  acc: ColumnAccumulator,
  type: ColumnType,
  tree: ValueTree,
  ancestors: string[] = []
) => {
  for (const [label, value] of typedEntries(tree)) {
    if (isValueTree(value)) {
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
  if (isValueTree(value)) {
    for (const [childKey, childValue] of typedEntries(value)) {
      collectChange(changes, type, file, childKey, childValue, commitData, [
        ...ancestors,
        key
      ])
    }
    return
  }

  if (
    !isEqual(get(commitData?.[type], [file, 'data', ...ancestors, key]), value)
  ) {
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

  for (const [key, value] of typedEntries(data)) {
    collectChange(changes, type, file, key, value, commitData)
  }
}

export const collectMetricAndParamChanges = (
  changes: string[],
  workspaceData: ExperimentFields,
  commitData: ExperimentFields
) => {
  for (const type of [ColumnType.METRICS, ColumnType.PARAMS]) {
    for (const [file, value] of Object.entries(workspaceData?.[type] || {}) as [
      string,
      ValueTreeOrError
    ][]) {
      collectFileChanges(changes, type, commitData, file, value)
    }
  }
}
