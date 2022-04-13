import { Value, ValueTree } from '../../../cli/reader'
import { appendMetricOrParamToPath } from '../../metricsAndParams/paths'
import { MetricsOrParams } from '../../webview/contract'

export type Param = {
  path: string
  value: number | string | boolean
}

const collectFromParamsFile = (
  acc: { path: string; value: string | number | boolean }[],
  key: string | undefined,
  value: Value | ValueTree,
  ancestors: string[] = []
) => {
  const pathArray = [...ancestors, key].filter(Boolean) as string[]

  if (typeof value === 'object') {
    for (const [childKey, childValue] of Object.entries(value as ValueTree)) {
      collectFromParamsFile(acc, childKey, childValue, pathArray)
    }
    return
  }

  const path = appendMetricOrParamToPath(...pathArray)

  acc.push({ path, value })
}

export const collectFlatExperimentParams = (params: MetricsOrParams = {}) => {
  const acc: { path: string; value: string | number | boolean }[] = []
  for (const file of Object.keys(params)) {
    collectFromParamsFile(acc, undefined, params[file], [file])
  }

  return acc
}
