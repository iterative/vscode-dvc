import { join } from 'path'
import {
  ExperimentsAccumulator,
  PartialColumnDescriptor,
  PartialColumnsMap
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
  originalColumnsMap: PartialColumnsMap,
  propertyKey: string,
  ancestors: string[]
) =>
  originalColumnsMap.get(propertyKey) || {
    group: ancestors[0],
    hasChildren: false,
    parentPath: join(...ancestors),
    path: join(...ancestors, propertyKey)
  }

const mergeNumberColumn = (
  columnDescriptor: PartialColumnDescriptor,
  newNumber: number
): void => {
  const { maxNumber, minNumber } = columnDescriptor
  if (maxNumber === undefined || maxNumber < newNumber) {
    columnDescriptor.maxNumber = newNumber
  }
  if (minNumber === undefined || minNumber > newNumber) {
    columnDescriptor.minNumber = newNumber
  }
}

const mergePrimitiveColumn = (
  columnDescriptor: PartialColumnDescriptor,
  newValue: Value,
  newValueType: string
): PartialColumnDescriptor => {
  const { maxStringLength } = columnDescriptor

  const stringifiedAddition = String(newValue)
  const additionStringLength = stringifiedAddition.length
  if (maxStringLength === undefined || maxStringLength < additionStringLength) {
    columnDescriptor.maxStringLength = additionStringLength
  }

  if (newValueType === 'number') {
    mergeNumberColumn(columnDescriptor, newValue as number)
  }

  return columnDescriptor as PartialColumnDescriptor
}

const mergeColumnsMap = (
  originalColumnsMap: PartialColumnsMap,
  valueTree: ValueTree,
  ...ancestors: string[]
): PartialColumnsMap => {
  const sampleEntries = Object.entries(valueTree)
  for (const [propertyKey, propertyValue] of sampleEntries) {
    originalColumnsMap.set(
      propertyKey,
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      mergeOrCreateColumnDescriptor(
        originalColumnsMap,
        propertyKey,
        propertyValue,
        ...ancestors
      )
    )
  }
  return originalColumnsMap
}

const mergeOrCreateColumnDescriptor = (
  originalColumnsMap: PartialColumnsMap,
  propertyKey: string,
  newValue: Value | ValueTree,
  ...ancestors: string[]
): PartialColumnDescriptor => {
  const newValueType = getValueType(newValue)

  const columnDescriptor = getEntryOrDefault(
    originalColumnsMap,
    propertyKey,
    ancestors
  )

  if (newValueType === 'object') {
    mergeColumnsMap(
      originalColumnsMap,
      newValue as ValueTree,
      ...ancestors,
      propertyKey
    )
    columnDescriptor.hasChildren = true
    return columnDescriptor as PartialColumnDescriptor
  } else {
    if (!columnDescriptor.types) {
      columnDescriptor.types = new Set()
    }
    const { types } = columnDescriptor
    types.add(newValueType)
    return mergePrimitiveColumn(
      columnDescriptor,
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

const collectColumnsFromExperiment = (
  acc: ExperimentsAccumulator,
  experiment: Experiment
) => {
  const { paramsMap, metricsMap } = acc
  const { params, metrics } = experiment
  if (params) {
    mergeColumnsMap(paramsMap, params, 'params')
  }
  if (metrics) {
    mergeColumnsMap(metricsMap, metrics, 'metrics')
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
      collectColumnsFromExperiment(acc, experiment)
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
      collectColumnsFromExperiment(acc, branch)
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
    collectColumnsFromExperiment(acc, workspaceBaseline)
  }

  collectFromBranchesObject(acc, branchesObject)
  return acc
}
