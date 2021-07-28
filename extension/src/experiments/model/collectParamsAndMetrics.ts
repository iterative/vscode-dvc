import { join } from 'path'
import {
  ParamOrMetricAggregateData,
  ParamsOrMetrics
} from '../webview/contract'
import {
  ExperimentFieldsOrError,
  ExperimentFields,
  ExperimentsBranchJSONOutput,
  ExperimentsRepoJSONOutput,
  Value,
  ValueTree,
  ValueTreeRoot
} from '../../cli/reader'

const getValueType = (value: Value | ValueTree) => {
  if (value === null) {
    return 'null'
  }
  return typeof value
}

const getEntryOrDefault = (
  originalMap: PartialParamsOrMetricsMap,
  propertyKey: string,
  ancestors: string[]
) =>
  originalMap.get(propertyKey) || {
    group: ancestors[0],
    hasChildren: false,
    parentPath: join(...ancestors),
    path: join(...ancestors, propertyKey),
    types: new Set<string>()
  }

const mergeNumberParamOrMetric = (
  descriptor: PartialParamOrMetricDescriptor,
  newNumber: number
): void => {
  const { maxNumber, minNumber } = descriptor
  if (maxNumber === undefined || maxNumber < newNumber) {
    descriptor.maxNumber = newNumber
  }
  if (minNumber === undefined || minNumber > newNumber) {
    descriptor.minNumber = newNumber
  }
}

const mergePrimitiveParamOrMetric = (
  descriptor: PartialParamOrMetricDescriptor,
  newValue: Value,
  newValueType: string
): PartialParamOrMetricDescriptor => {
  const { maxStringLength } = descriptor

  const stringifiedAddition = String(newValue)
  const additionStringLength = stringifiedAddition.length
  if (maxStringLength === undefined || maxStringLength < additionStringLength) {
    descriptor.maxStringLength = additionStringLength
  }

  if (newValueType === 'number') {
    mergeNumberParamOrMetric(descriptor, newValue as number)
  }

  return descriptor as PartialParamOrMetricDescriptor
}

const mergeParamsOrMetricsMap = (
  originalMap: PartialParamsOrMetricsMap,
  valueTree: ValueTree,
  ...ancestors: string[]
): PartialParamsOrMetricsMap => {
  const sampleEntries = Object.entries(valueTree)
  for (const [propertyKey, propertyValue] of sampleEntries) {
    originalMap.set(
      propertyKey,
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      mergeOrCreateDescriptor(
        originalMap,
        propertyKey,
        propertyValue,
        ...ancestors
      )
    )
  }
  return originalMap
}
const mergeOrCreateDescriptor = (
  originalMap: PartialParamsOrMetricsMap,
  propertyKey: string,
  newValue: Value | ValueTree,
  ...ancestors: string[]
): PartialParamOrMetricDescriptor => {
  const newValueType = getValueType(newValue)

  const descriptor = getEntryOrDefault(originalMap, propertyKey, ancestors)

  if (newValueType === 'object') {
    mergeParamsOrMetricsMap(
      originalMap,
      newValue as ValueTree,
      ...ancestors,
      propertyKey
    )
    descriptor.hasChildren = true
    return descriptor as PartialParamOrMetricDescriptor
  } else {
    descriptor.types.add(newValueType)
    return mergePrimitiveParamOrMetric(
      descriptor,
      newValue as Value,
      newValueType
    )
  }
}

const mergeParamsAndMetrics = (
  acc: ParamsAndMetricsAccumulator,
  paramsAndMetrics: {
    metrics: ParamsOrMetrics | undefined
    params: ParamsOrMetrics | undefined
  }
) => {
  const { paramsMap, metricsMap } = acc
  const { params, metrics } = paramsAndMetrics
  if (params) {
    mergeParamsOrMetricsMap(paramsMap, params, 'params')
  }
  if (metrics) {
    mergeParamsOrMetricsMap(metricsMap, metrics, 'metrics')
  }
}

const reduceParamsOrMetrics = (paramsOrMetrics?: ValueTreeRoot) => {
  if (paramsOrMetrics) {
    return Object.entries(paramsOrMetrics).reduce(
      (paramsOrMetrics, [file, dataOrError]) => {
        const data = dataOrError?.data
        if (data) {
          paramsOrMetrics[file] = data
        }
        return paramsOrMetrics
      },
      {} as ParamsOrMetrics
    )
  }
}

const reduceParamsAndMetrics = (
  experiment: ExperimentFields
): {
  metrics: ParamsOrMetrics | undefined
  params: ParamsOrMetrics | undefined
} => ({
  metrics: reduceParamsOrMetrics(experiment.metrics),
  params: reduceParamsOrMetrics(experiment.params)
})

const transformExperimentData = (
  experimentFieldsOrError: ExperimentFieldsOrError
):
  | {
      metrics: ParamsOrMetrics | undefined
      params: ParamsOrMetrics | undefined
    }
  | undefined => {
  const experimentFields = experimentFieldsOrError.data
  if (!experimentFields) {
    return
  }
  return reduceParamsAndMetrics(experimentFields)
}

const collectFromExperimentsObject = (
  acc: ParamsAndMetricsAccumulator,
  experimentsObject: { [sha: string]: ExperimentFieldsOrError }
) => {
  for (const experimentData of Object.values(experimentsObject)) {
    const experimentFields = transformExperimentData(experimentData)

    if (experimentFields) {
      mergeParamsAndMetrics(acc, experimentFields)
    }
  }
}

const collectFromBranchesObject = (
  acc: ParamsAndMetricsAccumulator,
  branchesObject: { [name: string]: ExperimentsBranchJSONOutput }
) => {
  for (const { baseline, ...experiments } of Object.values(branchesObject)) {
    const branch = transformExperimentData(baseline)

    if (branch) {
      mergeParamsAndMetrics(acc, branch)
      collectFromExperimentsObject(acc, experiments)
    }
  }
}

export interface PartialParamOrMetricDescriptor
  extends ParamOrMetricAggregateData {
  types: Set<string>
  hasChildren: boolean
  group: string
  path: string
  parentPath: string
}

export type PartialParamsOrMetricsMap = Map<
  string,
  PartialParamOrMetricDescriptor
>

export class ParamsAndMetricsAccumulator {
  public metricsMap: PartialParamsOrMetricsMap = new Map()
  public paramsMap: PartialParamsOrMetricsMap = new Map()
}

export const collectParamsAndMetrics = (
  data: ExperimentsRepoJSONOutput
): ParamsAndMetricsAccumulator => {
  const { workspace, ...branchesObject } = data
  const workspaceBaseline = transformExperimentData(workspace.baseline)

  const acc = new ParamsAndMetricsAccumulator()

  if (workspaceBaseline) {
    mergeParamsAndMetrics(acc, workspaceBaseline)
  }

  collectFromBranchesObject(acc, branchesObject)
  return acc
}
