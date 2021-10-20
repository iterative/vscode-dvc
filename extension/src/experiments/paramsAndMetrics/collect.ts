import get from 'lodash/get'
import { reduceParamsAndMetrics } from './reduce'
import { joinParamOrMetricPath } from './paths'
import {
  ParamOrMetric,
  ParamOrMetricAggregateData,
  ParamsOrMetrics
} from '../webview/contract'
import {
  ExperimentFields,
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
    parentPath: joinParamOrMetricPath(...ancestors),
    path: joinParamOrMetricPath(...ancestors, propertyKey),
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

const createEntry = (
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

const addMetadata = (
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
  const paramOrMetric = createEntry(name, descriptor)
  return addMetadata(paramOrMetric, descriptor)
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
    ...transformAndCollect(acc.paramsMap),
    ...transformAndCollect(acc.metricsMap)
  ]
}

const collectChange = (
  changes: string[],
  type: 'params' | 'metrics',
  file: string,
  key: string,
  value: Value | ValueTree,
  commitData: ExperimentFields,
  ancestors: string[] = []
) => {
  if (typeof value === 'object') {
    Object.entries(value as ValueTree).forEach(([childKey, childValue]) => {
      return collectChange(
        changes,
        type,
        file,
        childKey,
        childValue,
        commitData,
        [...ancestors, key]
      )
    })
    return
  }

  if (get(commitData?.[type], [file, 'data', ...ancestors, key]) !== value) {
    changes.push(joinParamOrMetricPath(type, file, ...ancestors, key))
  }
}

const collectParamsAndMetricsChanges = (
  changes: string[],
  workspaceData: ExperimentFields,
  commitData: ExperimentFields
) =>
  (['params', 'metrics'] as ('params' | 'metrics')[]).forEach(type =>
    Object.entries(workspaceData?.[type] || {}).forEach(([file, value]) => {
      const data = value.data
      if (!data) {
        return
      }

      Object.entries(data).forEach(([key, value]) =>
        collectChange(changes, type, file, key, value, commitData)
      )
    })
  )

const getData = (value: { baseline: ExperimentFieldsOrError }) =>
  value.baseline.data || {}

export const collectChanges = (data: ExperimentsRepoJSONOutput): string[] => {
  const changes: string[] = []

  const { workspace, currentCommit } = Object.entries(data).reduce(
    (acc, [key, value]) => {
      if (key === 'workspace') {
        acc.workspace = getData(value)
        return acc
      }
      acc.currentCommit = getData(value)
      return acc
    },
    {} as Record<string, ExperimentFields>
  )

  collectParamsAndMetricsChanges(changes, workspace, currentCommit)

  return changes.sort()
}
