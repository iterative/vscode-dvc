import get from 'lodash/get'
import { reduceMetricsAndParams } from './reduce'
import { joinMetricOrParamPath } from './paths'
import {
  MetricOrParam,
  MetricOrParamAggregateData,
  MetricsOrParams
} from '../webview/contract'
import {
  ExperimentFields,
  ExperimentFieldsOrError,
  ExperimentsBranchOutput,
  ExperimentsOutput,
  Value,
  ValueTree
} from '../../cli/reader'

interface PartialDescriptor extends MetricOrParamAggregateData {
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

type MetricsAndParams = {
  metrics: MetricsOrParams | undefined
  params: MetricsOrParams | undefined
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
    parentPath: joinMetricOrParamPath(...ancestors),
    path: joinMetricOrParamPath(...ancestors, propertyKey),
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

const mergeMetricsAndParams = (
  acc: Accumulator,
  metricsAndParams: MetricsAndParams
) => {
  const { paramsMap, metricsMap } = acc
  const { params, metrics } = metricsAndParams
  if (params) {
    mergeMap(paramsMap, params, 'params')
  }
  if (metrics) {
    mergeMap(metricsMap, metrics, 'metrics')
  }
}

const extractExperimentFields = (
  experimentFieldsOrError: ExperimentFieldsOrError
): MetricsAndParams | undefined => {
  const experimentFields = experimentFieldsOrError.data
  if (!experimentFields) {
    return
  }
  return reduceMetricsAndParams(experimentFields)
}

const collectFromExperimentsObject = (
  acc: Accumulator,
  experimentsObject: { [sha: string]: ExperimentFieldsOrError }
) => {
  for (const experiment of Object.values(experimentsObject)) {
    const experimentFields = extractExperimentFields(experiment)

    if (experimentFields) {
      mergeMetricsAndParams(acc, experimentFields)
    }
  }
}

const collectFromBranchesObject = (
  acc: Accumulator,
  branchesObject: { [name: string]: ExperimentsBranchOutput }
) => {
  for (const { baseline, ...experiments } of Object.values(branchesObject)) {
    const branch = extractExperimentFields(baseline)

    if (branch) {
      mergeMetricsAndParams(acc, branch)
      collectFromExperimentsObject(acc, experiments)
    }
  }
}

const createEntry = (
  name: string,
  descriptor: PartialDescriptor
): MetricOrParam => {
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
  metricOrParam: MetricOrParam,
  descriptor: PartialDescriptor
): MetricOrParam => {
  const { types, maxStringLength, minNumber, maxNumber } = descriptor

  if (maxStringLength) {
    metricOrParam.maxStringLength = maxStringLength
  }
  if (minNumber) {
    metricOrParam.minNumber = minNumber
    metricOrParam.maxNumber = maxNumber
  }
  if (types.size) {
    metricOrParam.types = [...types]
  }
  return metricOrParam
}

const transformMap = ([name, descriptor]: [
  string,
  PartialDescriptor
]): MetricOrParam => {
  const metricOrParam = createEntry(name, descriptor)
  return addMetadata(metricOrParam, descriptor)
}

const transformAndCollect = (
  metricsOrParamsMap: PartialMap
): MetricOrParam[] => {
  const metricsAndParams = []
  for (const entry of metricsOrParamsMap) {
    metricsAndParams.push(transformMap(entry))
  }
  return metricsAndParams
}

export const collectMetricsAndParams = (
  data: ExperimentsOutput
): MetricOrParam[] => {
  const { workspace, ...branchesObject } = data
  const workspaceBaseline = extractExperimentFields(workspace.baseline)

  const acc = {
    metricsMap: new Map(),
    paramsMap: new Map()
  }

  if (workspaceBaseline) {
    mergeMetricsAndParams(acc, workspaceBaseline)
  }

  collectFromBranchesObject(acc, branchesObject)

  return [
    ...transformAndCollect(acc.metricsMap),
    ...transformAndCollect(acc.paramsMap)
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
    changes.push(joinMetricOrParamPath(type, file, ...ancestors, key))
  }
}

const collectMetricsAndParamsChanges = (
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

export const collectChanges = (data: ExperimentsOutput): string[] => {
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

  collectMetricsAndParamsChanges(changes, workspace, currentCommit)

  return changes.sort()
}
