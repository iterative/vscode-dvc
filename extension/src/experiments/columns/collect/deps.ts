import { sep } from 'path'
import {
  ColumnAccumulator,
  limitAncestorDepth,
  mergeAncestors,
  mergeValueColumn
} from './util'
import { joinColumnPath } from '../paths'
import { ColumnType } from '../../webview/contract'
import { ExperimentFields } from '../../../cli/reader'

export const collectDeps = (acc: ColumnAccumulator, data: ExperimentFields) => {
  const { deps } = data
  if (!deps) {
    return
  }
  for (const [file, { hash }] of Object.entries(deps)) {
    const pathArray = file.split(sep)
    const name = pathArray.pop() as string

    const limitedDepthAncestors = limitAncestorDepth(pathArray, sep)
    const path = joinColumnPath(ColumnType.DEPS, file)

    mergeAncestors(
      acc,
      path,
      limitedDepthAncestors,
      (...pathArray: string[]) =>
        joinColumnPath(ColumnType.DEPS, pathArray.join(sep)),
      ColumnType.DEPS
    )

    mergeValueColumn(
      acc,
      name,
      hash,
      [ColumnType.DEPS, file],
      path,
      joinColumnPath(ColumnType.DEPS, limitedDepthAncestors.join(sep))
    )
  }
}
