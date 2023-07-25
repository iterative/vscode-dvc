import { sep } from 'path'
import get from 'lodash.get'
import {
  ColumnAccumulator,
  limitAncestorDepth,
  mergeAncestors,
  collectColumn
} from './util'
import { buildDepPath } from '../paths'
import { ColumnType } from '../../webview/contract'
import { ExpData } from '../../../cli/dvc/contract'
import { getPathArray } from '../../../fileSystem/util'
import { shortenForLabel } from '../../../util/string'

export const collectDeps = (acc: ColumnAccumulator, data: ExpData) => {
  const { deps } = data
  if (!deps) {
    return
  }
  for (const [file, { hash }] of Object.entries(deps)) {
    const pathArray = getPathArray(file)
    const label = pathArray.pop() as string

    const { limitedDepthAncestors, limitedDepthLabel } = limitAncestorDepth(
      pathArray,
      sep,
      '/',
      label
    )
    const path = buildDepPath(file)

    mergeAncestors(
      acc,
      ColumnType.DEPS,
      path,
      limitedDepthAncestors,
      (...pathArray: string[]) => buildDepPath(...pathArray)
    )

    collectColumn(
      acc,
      path,
      buildDepPath(...limitedDepthAncestors),
      [ColumnType.DEPS, file],
      limitedDepthLabel,
      shortenForLabel(hash)
    )
  }
}

export const collectDepChanges = (
  changes: string[],
  workspace: ExpData,
  baseline: ExpData
) => {
  for (const [file, { hash }] of Object.entries(
    workspace?.[ColumnType.DEPS] || {}
  )) {
    if (get(baseline?.[ColumnType.DEPS], [file, 'hash']) !== hash) {
      changes.push(buildDepPath(file))
    }
  }
}
