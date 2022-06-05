import { sep } from 'path'
import get from 'lodash.get'
import {
  ColumnAccumulator,
  limitAncestorDepth,
  mergeAncestors,
  mergeValueColumn
} from './util'
import { buildMetricOrParamPath } from '../paths'
import { ColumnType } from '../../webview/contract'
import { ExperimentFields } from '../../../cli/reader'
import { getPathArray } from '../../../fileSystem/util'

export const collectDeps = (acc: ColumnAccumulator, data: ExperimentFields) => {
  const { deps } = data
  if (!deps) {
    return
  }
  for (const [file, { hash }] of Object.entries(deps)) {
    const pathArray = getPathArray(file)
    const name = pathArray.pop() as string

    const limitedDepthAncestors = limitAncestorDepth(pathArray, sep)
    const path = buildMetricOrParamPath(ColumnType.DEPS, file)

    mergeAncestors(
      acc,
      path,
      limitedDepthAncestors,
      (...pathArray: string[]) =>
        buildMetricOrParamPath(ColumnType.DEPS, pathArray.join(sep)),
      ColumnType.DEPS
    )

    mergeValueColumn(
      acc,
      name,
      hash,
      [ColumnType.DEPS, file],
      path,
      buildMetricOrParamPath(ColumnType.DEPS, limitedDepthAncestors.join(sep))
    )
  }
}

export const collectDepChanges = (
  changes: string[],
  workspaceData: ExperimentFields,
  commitData: ExperimentFields
) => {
  for (const [file, { hash }] of Object.entries(
    workspaceData?.[ColumnType.DEPS] || {}
  )) {
    if (get(commitData?.[ColumnType.DEPS], [file, 'hash']) !== hash) {
      changes.push(buildMetricOrParamPath(ColumnType.DEPS, file))
    }
  }
}
