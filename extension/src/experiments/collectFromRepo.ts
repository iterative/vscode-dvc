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

export type RunningOrQueued = { status: RowStatus }

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
  runningOrQueued: Map<string, RunningOrQueued>
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

const consolidateExperimentData = (
  sha: string,
  baseline: ExperimentFields
): ExperimentFields & { id: string; displayName: string } => ({
  id: sha,
  ...baseline,
  displayName: baseline.name || sha.slice(0, 7)
})

const collectRunningOrQueued = (
  acc: ExperimentsAccumulator,
  experiment: ExperimentFields & { id: string; displayName: string }
) => {
  if (experiment.running) {
    acc.runningOrQueued.set(experiment.displayName, {
      status: RowStatus.RUNNING
    })
  }
  if (experiment.queued) {
    acc.runningOrQueued.set(experiment.displayName, {
      status: RowStatus.QUEUED
    })
  }
}

const collectFromExperimentsObject = (
  acc: ExperimentsAccumulator,
  experimentsObject: { [sha: string]: ExperimentFields },
  parentId: string
) => {
  for (const [sha, experimentData] of Object.entries(experimentsObject)) {
    const experiment = consolidateExperimentData(sha, experimentData)

    collectColumnsFromExperiment(acc, experiment)

    const { checkpoint_tip, id } = experiment
    if (checkpoint_tip && checkpoint_tip !== id) {
      acc.branches.push({
        ...experiment,
        level: 3,
        parentPath: join(parentId, checkpoint_tip),
        path: join(parentId, checkpoint_tip, experiment.id)
      })
    } else {
      acc.branches.push({
        ...experiment,
        level: 2,
        parentPath: parentId,
        path: join(parentId, experiment.id)
      })
    }

    collectRunningOrQueued(acc, experiment)
  }
}

const collectFromBranchEntry = (
  acc: ExperimentsAccumulator,
  [branchSha, { baseline, ...experimentsObject }]: [
    string,
    ExperimentsBranchJSONOutput
  ]
) => {
  const branch = {
    ...consolidateExperimentData(branchSha, baseline),
    level: 1,
    path: branchSha
  }

  collectColumnsFromExperiment(acc, branch)

  collectFromExperimentsObject(acc, experimentsObject, branchSha)

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
    runningOrQueued: new Map(),
    workspace: {
      ...workspace.baseline,
      displayName: 'workspace',
      id: 'workspace',
      level: 1,
      path: 'workspace'
    }
  }
  collectColumnsFromExperiment(acc, workspace.baseline)

  if (workspace.baseline.running) {
    acc.runningOrQueued.set('workspace', {
      status: RowStatus.RUNNING
    })
  }

  collectFromBranchesObject(acc, branchesObject)
  return acc
}
