import { sep } from 'path'
import get from 'lodash.get'
import {
  ColumnAccumulator,
  limitAncestorDepth,
  mergeAncestors,
  mergeValueColumn
} from './util'
import { buildDepPath } from '../paths'
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
    const label = pathArray.pop() as string

    const limitedDepthAncestors = limitAncestorDepth(pathArray, sep)
    const path = buildDepPath(file)

    mergeAncestors(
      acc,
      ColumnType.DEPS,
      path,
      limitedDepthAncestors,
      (...pathArray: string[]) => buildDepPath(...pathArray)
    )

    mergeValueColumn(
      acc,
      path,
      buildDepPath(...limitedDepthAncestors),
      [ColumnType.DEPS, file],
      label,
      hash
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
      changes.push(buildDepPath(file))
    }
  }
}
