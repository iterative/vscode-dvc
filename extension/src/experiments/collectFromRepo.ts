import { join } from 'path'
import { Experiment, ColumnAggregateData } from './webview/contract'
import {
  ExperimentFields,
  ExperimentsBranchJSONOutput,
  ExperimentsRepoJSONOutput,
  Value,
  ValueTree
} from '../cli/reader'

export enum RowStatus {
  RUNNING = 'running',
  QUEUED = 'queued'
}

export interface PartialColumnDescriptor extends ColumnAggregateData {
  types?: Set<string>
  hasChildren: boolean
  group: string
  path: string
  parentPath: string
}
export type PartialColumnsMap = Map<string, PartialColumnDescriptor>

interface ExperimentsAccumulator {
  paramsMap: PartialColumnsMap
  metricsMap: PartialColumnsMap
  checkpointsByTip: Map<string, Experiment[]>
  branches: Experiment[]
  runningOrQueued: { name: string; status: RowStatus }[]
  workspace: Experiment
}

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
  experiment: Experiment | ExperimentFields
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

const nestExperiment = (
  checkpointTips: Experiment[],
  checkpointsByTip: Map<string, Experiment[]>,
  experiment: Experiment
) => {
  const { checkpoint_tip, id } = experiment
  if (checkpoint_tip && checkpoint_tip !== id) {
    addToMapArray(checkpointsByTip, checkpoint_tip, experiment)
  } else {
    checkpointTips.push(experiment)
  }
}

const addCheckpointsToTips = (
  experiments: Experiment[],
  checkpointsByTip: Map<string, Experiment[]>
) => {
  for (const checkpointTip of experiments) {
    const subRows = checkpointsByTip.get(checkpointTip.id as string)
    if (subRows) {
      checkpointTip.subRows = subRows
    }
  }
}

const consolidateExperimentData = (
  sha: string,
  baseline: ExperimentFields
): Experiment => ({
  id: sha,
  ...baseline,
  displayName: baseline.name || sha.slice(0, 7)
})

const addToRunningOrQueued = (
  acc: ExperimentsAccumulator,
  experiment: Experiment
) => {
  const status = experiment.running ? RowStatus.RUNNING : RowStatus.QUEUED
  acc.runningOrQueued.push({
    name: experiment.displayName,
    status
  })
}

const collectFromBranchEntry = (
  acc: ExperimentsAccumulator,
  [branchSha, { baseline, ...experimentsObject }]: [
    string,
    ExperimentsBranchJSONOutput
  ]
) => {
  const branch = consolidateExperimentData(branchSha, baseline)

  collectColumnsFromExperiment(acc, branch)
  const experiments: Experiment[] = []
  const checkpointsByTip = new Map<string, Experiment[]>()

  for (const [sha, experimentData] of Object.entries(experimentsObject)) {
    const experiment = consolidateExperimentData(sha, experimentData)

    if (experiment.queued || experiment.running) {
      addToRunningOrQueued(acc, experiment)
    }

    collectColumnsFromExperiment(acc, experiment)
    nestExperiment(experiments, checkpointsByTip, experiment)
  }
  addCheckpointsToTips(experiments, checkpointsByTip)

  if (experiments.length > 0) {
    branch.subRows = experiments
  }
  acc.branches.push(branch)
}

const collectFromBranchesObject = (
  acc: ExperimentsAccumulator,
  branchesObject: { [name: string]: ExperimentsBranchJSONOutput }
) => {
  for (const branchEntry of Object.entries(branchesObject)) {
    collectFromBranchEntry(acc, branchEntry)
  }
}

export const collectFromRepo = (
  data: ExperimentsRepoJSONOutput
): ExperimentsAccumulator => {
  const { workspace, ...branchesObject } = data
  const acc: ExperimentsAccumulator = {
    branches: [] as Experiment[],
    checkpointsByTip: new Map(),
    metricsMap: new Map(),
    paramsMap: new Map(),
    runningOrQueued: [],
    workspace: {
      ...workspace.baseline,
      displayName: 'workspace',
      id: 'workspace'
    }
  }
  collectColumnsFromExperiment(acc, workspace.baseline)

  if (workspace.baseline.running) {
    acc.runningOrQueued.push({
      name: 'workspace',
      status: RowStatus.RUNNING
    })
  }

  collectFromBranchesObject(acc, branchesObject)
  return acc
}
