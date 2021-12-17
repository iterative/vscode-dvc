import { Value, ValueTree } from '../../../cli/reader'
import { joinMetricOrParamFilePath } from '../../metricsAndParams/paths'
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
    Object.entries(value as ValueTree).forEach(([childKey, childValue]) => {
      return collectFromParamsFile(acc, childKey, childValue, pathArray)
    })
    return
  }

  const path = joinMetricOrParamFilePath(...pathArray)

  acc.push({ path, value })
}

export const collectFlatExperimentParams = (params: MetricsOrParams = {}) => {
  const acc: { path: string; value: string | number | boolean }[] = []
  Object.keys(params).forEach(file =>
    collectFromParamsFile(acc, undefined, params[file], [file])
  )
  return acc
}
