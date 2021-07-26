import {
  PartialParamOrMetricDescriptor,
  PartialParamsOrMetricsMap
} from './accumulator'
import { ParamOrMetric } from '../webview/contract'

const createInitial = (
  name: string,
  descriptor: PartialParamOrMetricDescriptor
): ParamOrMetric => {
  const { group, path, hasChildren, parentPath } = descriptor

  return {
    group,
    hasChildren,
    name,
    parentPath,
    path
  }
}

const enrich = (
  paramOrMetric: ParamOrMetric,
  descriptor: PartialParamOrMetricDescriptor
): ParamOrMetric => {
  const { types, maxStringLength, minNumber, maxNumber } = descriptor

  if (maxStringLength) {
    paramOrMetric.maxStringLength = maxStringLength
  }
  if (minNumber) {
    paramOrMetric.minNumber = minNumber
    paramOrMetric.maxNumber = maxNumber
  }
  if (types.size) {
    paramOrMetric.types = [...types]
  }
  return paramOrMetric
}

const paramOrMetricFromMap = ([name, descriptor]: [
  string,
  PartialParamOrMetricDescriptor
]): ParamOrMetric => {
  const paramOrMetric = createInitial(name, descriptor)
  return enrich(paramOrMetric, descriptor)
}

const transformAndCollect = (
  paramsOrMetricsMap: PartialParamsOrMetricsMap
): ParamOrMetric[] => {
  const paramsAndMetrics = []
  for (const entry of paramsOrMetricsMap) {
    paramsAndMetrics.push(paramOrMetricFromMap(entry))
  }
  return paramsAndMetrics
}

export const transformAndCollectIfAny = (
  paramsOrMetricsMap: PartialParamsOrMetricsMap
): ParamOrMetric[] =>
  paramsOrMetricsMap.size === 0 ? [] : transformAndCollect(paramsOrMetricsMap)
