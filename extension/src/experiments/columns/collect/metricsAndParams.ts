import get from 'lodash.get'
import isEqual from 'lodash.isequal'
import {
  ColumnAccumulator,
  limitAncestorDepth,
  mergeAncestors,
  collectColumn
} from './util'
import { ColumnType } from '../../webview/contract'
import {
  ExpData,
  isValueTree,
  Value,
  ValueTree,
  FileDataOrError,
  fileHasError,
  MetricsOrParams
} from '../../../cli/dvc/contract'
import { buildMetricOrParamPath } from '../paths'
import { FILE_SEPARATOR, METRIC_PARAM_SEPARATOR } from '../constants'

const collectMetricOrParam = (
  acc: ColumnAccumulator,
  type: ColumnType,
  pathArray: string[],
  label: string,
  value: Value
) => {
  const path = buildMetricOrParamPath(type, ...pathArray, label)
  if (acc.collected.has(path)) {
    return
  }
  acc.collected.add(path)

  const { limitedDepthAncestors, limitedDepthLabel } = limitAncestorDepth(
    pathArray,
    METRIC_PARAM_SEPARATOR,
    FILE_SEPARATOR,
    label
  )
  const limitedPath = buildMetricOrParamPath(
    type,
    ...limitedDepthAncestors,
    limitedDepthLabel
  )

  mergeAncestors(
    acc,
    type,
    limitedPath,
    limitedDepthAncestors,
    (...pathArray: string[]) => buildMetricOrParamPath(type, ...pathArray)
  )

  collectColumn(
    acc,
    limitedPath,
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
  for (const [label, value] of Object.entries(tree)) {
    if (isValueTree(value)) {
      walkValueTree(acc, type, value, [...ancestors, label])
    } else {
      collectMetricOrParam(acc, type, ancestors, label, value)
    }
  }
}

const walkMetricsOrParamsFile = (
  acc: ColumnAccumulator,
  type: ColumnType,
  file: MetricsOrParams
) => {
  for (const [path, value] of Object.entries(file)) {
    if (fileHasError(value)) {
      continue
    }
    const { data } = value
    if (data) {
      walkValueTree(acc, type, data, [path])
    }
  }
}

const collectMetricsOrParams = (
  acc: ColumnAccumulator,
  type: ColumnType,
  metricsOrParams: MetricsOrParams | null
): void => {
  if (!metricsOrParams) {
    return
  }
  walkMetricsOrParamsFile(acc, type, metricsOrParams)
}

export const collectMetricsAndParams = (
  acc: ColumnAccumulator,
  data: ExpData
) => {
  const { metrics, params } = data
  return Promise.all([
    // eslint-disable-next-line sonarjs/no-use-of-empty-return-value
    collectMetricsOrParams(acc, ColumnType.METRICS, metrics),
    // eslint-disable-next-line sonarjs/no-use-of-empty-return-value
    collectMetricsOrParams(acc, ColumnType.PARAMS, params)
  ])
}

const collectChange = (
  changes: string[],
  type: ColumnType,
  file: string,
  key: string,
  value: Value | ValueTree,
  commitData: ExpData,
  ancestors: string[] = []
) => {
  if (isValueTree(value)) {
    for (const [childKey, childValue] of Object.entries(value)) {
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
  commitData: ExpData,
  file: string,
  value: FileDataOrError
) => {
  if (fileHasError(value)) {
    return
  }

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
  workspace: ExpData,
  baseline: ExpData
) => {
  for (const type of [ColumnType.METRICS, ColumnType.PARAMS]) {
    for (const [file, value] of Object.entries(workspace?.[type] || {}) as [
      string,
      FileDataOrError
    ][]) {
      collectFileChanges(changes, type, baseline, file, value)
    }
  }
}
