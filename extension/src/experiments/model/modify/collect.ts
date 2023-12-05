import { isValueTree, Value, ValueTree } from '../../../cli/dvc/contract'
import { FILE_SEPARATOR } from '../../columns/constants'
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

const removeFilePrefixIfOnlyDefault = (
  acc: Param[],
  paramsFiles: string[]
): Param[] => {
  const defaultParamsFile = 'params.yaml'
  if (paramsFiles.length === 1 && paramsFiles[0] === defaultParamsFile) {
    const prefixToRemoveLength = (defaultParamsFile + FILE_SEPARATOR).length
    return acc.map(({ path, value }) => ({
      path: path.slice(prefixToRemoveLength),
      value
    }))
  }

  return acc
}

export const collectFlatExperimentParams = (
  params: MetricOrParamColumns = {}
) => {
  const acc: Param[] = []
  const paramsFiles = Object.keys(params)

  for (const file of paramsFiles) {
    collectFromParamsFile(acc, undefined, params[file], [file])
  }

  return removeFilePrefixIfOnlyDefault(acc, paramsFiles)
}
