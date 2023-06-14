import { isValueTree, Value, ValueTree } from '../../../cli/dvc/contract'
import { appendColumnToPath } from '../../columns/paths'
import { MetricOrParamColumns } from '../../webview/contract'

export type Param = {
  path: string
  value: Value
}

export type ParamWithIsString = Param & { isString: boolean }

const collectFromParamsFile = (
  acc: ParamWithIsString[],
  key: string | undefined,
  value: Value | ValueTree,
  ancestors: string[] = []
) => {
  const pathArray = [...ancestors, key].filter(Boolean) as string[]

  if (isValueTree(value)) {
    for (const [childKey, childValue] of Object.entries(value)) {
      collectFromParamsFile(acc, childKey, childValue, pathArray)
    }
    return
  }

  const path = appendColumnToPath(...pathArray)

  acc.push({ isString: typeof value === 'string', path, value })
}

export const collectFlatExperimentParams = (
  params: MetricOrParamColumns = {}
) => {
  const acc: ParamWithIsString[] = []
  for (const file of Object.keys(params)) {
    collectFromParamsFile(acc, undefined, params[file], [file])
  }

  return acc
}
