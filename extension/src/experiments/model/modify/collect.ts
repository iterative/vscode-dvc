import { isValueTree, Value, ValueTree } from '../../../cli/dvc/contract'
import { appendColumnToPath } from '../../columns/paths'
import { MetricOrParamColumns } from '../../webview/contract'

export type Param = {
  path: string
  value: Value
}

const collectFromParamsFile = (
  acc: { path: string; value: Value | undefined }[],
  key: string | undefined,
  value: Value | ValueTree,
  ancestors: string[] = []
) => {
  const pathArray = [...ancestors, key].filter(Boolean) as string[]

  const isLeaf = !isValueTree(value)

  const path = appendColumnToPath(...pathArray)

  if (pathArray.length > 1) {
    acc.push({ path, value: isLeaf ? value : undefined })
  }

  if (!isLeaf) {
    for (const [childKey, childValue] of Object.entries(value)) {
      collectFromParamsFile(acc, childKey, childValue, pathArray)
    }
  }
}

export const collectFlatExperimentParams = (
  params: MetricOrParamColumns = {}
) => {
  const acc: Param[] = []
  for (const file of Object.keys(params)) {
    collectFromParamsFile(acc, undefined, params[file], [file])
  }

  return acc
}
