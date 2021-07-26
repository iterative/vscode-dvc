import { join } from 'path'
import {
  ExperimentsAccumulator,
  PartialParamOrMetricDescriptor,
  PartialParamsOrMetricsMap
} from './accumulator'
import { Experiment, ParamsOrMetrics } from '../webview/contract'
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

const addToMapArray = <K = string, V = unknown>(
  map: Map<K, V[]>,
  key: K,
  value: V
): void => {
  const existingArray = map.get(key)
  if (existingArray) {
    existingArray.push(value)
  } else {
    const newArray = [value]
    map.set(key, newArray)
  }
}

const collectParamsAndMetrics = (
  acc: ExperimentsAccumulator,
  experiment: Experiment
) => {
  const { paramsMap, metricsMap } = acc
  const { params, metrics } = experiment
  if (params) {
    mergeParamsOrMetricsMap(paramsMap, params, 'params')
  }
  if (metrics) {
    mergeParamsOrMetricsMap(metricsMap, metrics, 'metrics')
  }
}

const collectExperimentOrCheckpoint = (
  acc: ExperimentsAccumulator,
  experiment: Experiment,
  branchName: string
) => {
  const { checkpoint_tip, id } = experiment
  if (checkpoint_tip && checkpoint_tip !== id) {
    addToMapArray(acc.checkpointsByTip, checkpoint_tip, experiment)
  } else {
    addToMapArray(acc.experimentsByBranch, branchName, experiment)
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

const transformParamsAndMetrics = (
  experiment: Experiment,
  experimentFields: ExperimentFields
) => {
  const { metrics, params } = reduceParamsAndMetrics(experimentFields)

  if (metrics) {
    experiment.metrics = metrics
  }
  if (params) {
    experiment.params = params
  }
}

const transformExperimentData = (
  sha: string,
  experimentFieldsOrError: ExperimentFieldsOrError,
  fallbackDisplayNameLength = 7
): Experiment | undefined => {
  const experimentFields = experimentFieldsOrError.data
  if (!experimentFields) {
    return
  }

  const experiment = {
    id: sha,
    ...experimentFields,
    displayName:
      experimentFields?.name || sha.slice(0, fallbackDisplayNameLength)
  } as Experiment

  transformParamsAndMetrics(experiment, experimentFields)

  return experiment
}

const collectFromExperimentsObject = (
  acc: ExperimentsAccumulator,
  experimentsObject: { [sha: string]: ExperimentFieldsOrError },
  branchName: string
) => {
  for (const [sha, experimentData] of Object.entries(experimentsObject)) {
    const experiment = transformExperimentData(sha, experimentData)

    if (experiment) {
      collectParamsAndMetrics(acc, experiment)
      collectExperimentOrCheckpoint(acc, experiment, branchName)
    }
  }
}

const collectFromBranchesObject = (
  acc: ExperimentsAccumulator,
  branchesObject: { [name: string]: ExperimentsBranchJSONOutput }
) => {
  for (const [branchSha, { baseline, ...experimentsObject }] of Object.entries(
    branchesObject
  )) {
    const branch = transformExperimentData(branchSha, baseline)

    if (branch) {
      collectParamsAndMetrics(acc, branch)
      collectFromExperimentsObject(acc, experimentsObject, branch.displayName)

      acc.branches.push(branch)
    }
  }
}

export const collectFromRepo = (
  data: ExperimentsRepoJSONOutput
): ExperimentsAccumulator => {
  const { workspace, ...branchesObject } = data
  const workspaceBaseline = transformExperimentData(
    'workspace',
    workspace.baseline,
    9
  )

  const acc = new ExperimentsAccumulator(workspaceBaseline)

  if (workspaceBaseline) {
    collectParamsAndMetrics(acc, workspaceBaseline)
  }

  collectFromBranchesObject(acc, branchesObject)
  return acc
}
