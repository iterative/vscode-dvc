import { join } from 'path'
import { reduceParamsAndMetrics } from './reduceParamsAndMetrics'
import {
  ParamOrMetric,
  ParamOrMetricAggregateData,
  ParamsOrMetrics
} from '../webview/contract'
import {
  ExperimentFieldsOrError,
  ExperimentsBranchJSONOutput,
  ExperimentsRepoJSONOutput,
  Value,
  ValueTree
} from '../../cli/reader'

interface PartialDescriptor extends ParamOrMetricAggregateData {
  types: Set<string>
  hasChildren: boolean
  group: string
  path: string
  parentPath: string
}

type PartialMap = Map<string, PartialDescriptor>

type Accumulator = {
  metricsMap: PartialMap
  paramsMap: PartialMap
}

type ParamsAndMetrics = {
  metrics: ParamsOrMetrics | undefined
  params: ParamsOrMetrics | undefined
}

const getValueType = (value: Value | ValueTree) => {
  if (value === null) {
    return 'null'
  }
  return typeof value
}

const getEntryOrDefault = (
  originalMap: PartialMap,
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

const mergeNumber = (
  descriptor: PartialDescriptor,
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

const mergePrimitiveValue = (
  descriptor: PartialDescriptor,
  newValue: Value,
  newValueType: string
): PartialDescriptor => {
  const { maxStringLength } = descriptor

  const stringifiedAddition = String(newValue)
  const additionStringLength = stringifiedAddition.length
  if (maxStringLength === undefined || maxStringLength < additionStringLength) {
    descriptor.maxStringLength = additionStringLength
  }

  if (newValueType === 'number') {
    mergeNumber(descriptor, newValue as number)
  }

  return descriptor as PartialDescriptor
}

const mergeMap = (
  originalMap: PartialMap,
  valueTree: ValueTree,
  ...ancestors: string[]
): PartialMap => {
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
  originalMap: PartialMap,
  propertyKey: string,
  newValue: Value | ValueTree,
  ...ancestors: string[]
): PartialDescriptor => {
  const newValueType = getValueType(newValue)

  const descriptor = getEntryOrDefault(originalMap, propertyKey, ancestors)

  if (newValueType === 'object') {
    mergeMap(originalMap, newValue as ValueTree, ...ancestors, propertyKey)
    descriptor.hasChildren = true
    return descriptor as PartialDescriptor
  } else {
    descriptor.types.add(newValueType)
    return mergePrimitiveValue(descriptor, newValue as Value, newValueType)
  }
}

const mergeParamsAndMetrics = (
  acc: Accumulator,
  paramsAndMetrics: ParamsAndMetrics
) => {
  const { paramsMap, metricsMap } = acc
  const { params, metrics } = paramsAndMetrics
  if (params) {
    mergeMap(paramsMap, params, 'params')
  }
  if (metrics) {
    mergeMap(metricsMap, metrics, 'metrics')
  }
}

const extractExperimentFields = (
  experimentFieldsOrError: ExperimentFieldsOrError
): ParamsAndMetrics | undefined => {
  const experimentFields = experimentFieldsOrError.data
  if (!experimentFields) {
    return
  }
  return reduceParamsAndMetrics(experimentFields)
}

const collectFromExperimentsObject = (
  acc: Accumulator,
  experimentsObject: { [sha: string]: ExperimentFieldsOrError }
) => {
  for (const experiment of Object.values(experimentsObject)) {
    const experimentFields = extractExperimentFields(experiment)

    if (experimentFields) {
      mergeParamsAndMetrics(acc, experimentFields)
    }
  }
}

const collectFromBranchesObject = (
  acc: Accumulator,
  branchesObject: { [name: string]: ExperimentsBranchJSONOutput }
) => {
  for (const { baseline, ...experiments } of Object.values(branchesObject)) {
    const branch = extractExperimentFields(baseline)

    if (branch) {
      mergeParamsAndMetrics(acc, branch)
      collectFromExperimentsObject(acc, experiments)
    }
  }
}

const createInitial = (
  name: string,
  descriptor: PartialDescriptor
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
  descriptor: PartialDescriptor
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

const transformMap = ([name, descriptor]: [
  string,
  PartialDescriptor
]): ParamOrMetric => {
  const paramOrMetric = createInitial(name, descriptor)
  return enrich(paramOrMetric, descriptor)
}

const transformAndCollect = (
  paramsOrMetricsMap: PartialMap
): ParamOrMetric[] => {
  const paramsAndMetrics = []
  for (const entry of paramsOrMetricsMap) {
    paramsAndMetrics.push(transformMap(entry))
  }
  return paramsAndMetrics
}

export const transformAndCollectIfAny = (
  paramsOrMetricsMap: PartialMap
): ParamOrMetric[] =>
  paramsOrMetricsMap.size ? transformAndCollect(paramsOrMetricsMap) : []

export const collectParamsAndMetrics = (
  data: ExperimentsRepoJSONOutput
): ParamOrMetric[] => {
  const { workspace, ...branchesObject } = data
  const workspaceBaseline = extractExperimentFields(workspace.baseline)

  const acc = {
    metricsMap: new Map(),
    paramsMap: new Map()
  }

  if (workspaceBaseline) {
    mergeParamsAndMetrics(acc, workspaceBaseline)
  }

  collectFromBranchesObject(acc, branchesObject)

  return [
    ...transformAndCollectIfAny(acc.paramsMap),
    ...transformAndCollectIfAny(acc.metricsMap)
  ]
}
