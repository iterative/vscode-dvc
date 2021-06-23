import {
  ExperimentsRepoJSONOutput,
  Value,
  ValueTree,
  Experiment,
  ExperimentsBranchJSONOutput,
  ExperimentsBranch,
  ExperimentsWorkspace
} from './contract'

interface ColumnCommon {
  maxStringLength?: number
  maxNumber?: number
  minNumber?: number
}

interface PartialColumnDescriptor extends ColumnCommon {
  types?: Set<string>
  childColumns?: PartialColumnsMap
}
type PartialColumnsMap = Map<string, PartialColumnDescriptor>

export interface Column extends ColumnCommon {
  name: string
  types?: string[]
  childColumns?: Column[]
  ancestors?: string[]
}

interface ExperimentsAccumulator {
  paramsMap: PartialColumnsMap
  metricsMap: PartialColumnsMap
  checkpointsByTip: Map<string, Experiment[]>
  branches: ExperimentsBranch[]
  workspace: ExperimentsWorkspace
}

export interface TransformedExperiments {
  metrics?: Column[]
  params?: Column[]
  branches: ExperimentsBranch[]
  workspace: ExperimentsWorkspace
}

const getValueType = (value: Value | ValueTree) => {
  if (value === null) {
    return 'null'
  }
  return typeof value
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
  valueTree: ValueTree
): PartialColumnsMap => {
  const sampleEntries = Object.entries(valueTree)
  for (const [propertyKey, propertyValue] of sampleEntries) {
    originalColumnsMap.set(
      propertyKey,
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      mergeOrCreateColumnDescriptor(
        originalColumnsMap.get(propertyKey),
        propertyValue
      )
    )
  }
  return originalColumnsMap
}

const mergeOrCreateColumnDescriptor = (
  columnDescriptor: PartialColumnDescriptor = {},
  newValue: Value | ValueTree
): PartialColumnDescriptor => {
  const newValueType = getValueType(newValue)

  if (newValueType === 'object') {
    columnDescriptor.childColumns = mergeColumnsMap(
      columnDescriptor.childColumns || new Map(),
      newValue as ValueTree
    )
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

const columnFromMapEntry = (
  entry: [string, PartialColumnDescriptor]
): Column => {
  const [name, partialColumnDescriptor] = entry
  const { types, maxStringLength, minNumber, maxNumber } =
    partialColumnDescriptor
  const column: Column = {
    name
  }
  if (maxStringLength) {
    column.maxStringLength = maxStringLength
  }
  if (minNumber) {
    column.minNumber = minNumber
    column.maxNumber = maxNumber
  }
  if (types) {
    column.types = [...types]
  }
  return column
}

const transformAndCollectFromColumns = (
  columnsMap: PartialColumnsMap,
  ancestors?: string[]
): Column[] => {
  const currentLevelColumns = []
  for (const entry of columnsMap) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    currentLevelColumns.push(buildColumn(entry, ancestors))
  }
  return currentLevelColumns
}

const transformAndCollectFromColumnsIfAny = (
  columnsMap: PartialColumnsMap
): Column[] | undefined =>
  columnsMap.size === 0 ? undefined : transformAndCollectFromColumns(columnsMap)

const buildColumn = (
  entry: [string, PartialColumnDescriptor],
  ancestors?: string[]
): Column => {
  const finalColumn = columnFromMapEntry(entry)

  const [name, { childColumns }] = entry

  if (ancestors) {
    finalColumn.ancestors = ancestors
  }

  if (childColumns) {
    finalColumn.childColumns = transformAndCollectFromColumns(
      childColumns,
      ancestors ? [...ancestors, name] : [name]
    )
  }

  return finalColumn
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
    mergeColumnsMap(paramsMap, params)
  }
  if (metrics) {
    mergeColumnsMap(metricsMap, metrics)
  }
}

const collectExperimentIntoCheckpoints = (
  experiments: Experiment[],
  checkpointsByTip: Map<string, Experiment[]>,
  experiment: Experiment
) => {
  const { checkpoint_tip, sha } = experiment
  if (checkpoint_tip && checkpoint_tip !== sha) {
    addToMapArray(checkpointsByTip, checkpoint_tip, experiment)
  } else {
    experiments.push(experiment)
  }
}

const addCheckpointsToTips = (
  experiments: Experiment[],
  checkpointsByTip: Map<string, Experiment[]>
) => {
  for (const checkpointTip of experiments) {
    const checkpoints = checkpointsByTip.get(checkpointTip.sha as string)
    if (checkpoints) {
      checkpointTip.checkpoints = checkpoints
    }
  }
}

const collectFromBranchEntry = (
  acc: ExperimentsAccumulator,
  [name, { baseline, ...experimentsObject }]: [
    string,
    ExperimentsBranchJSONOutput
  ]
) => {
  collectColumnsFromExperiment(acc, baseline)
  const experiments: Experiment[] = []
  const checkpointsByTip = new Map<string, Experiment[]>()

  for (const [sha, experimentData] of Object.entries(experimentsObject)) {
    const experiment: Experiment = { ...experimentData, sha }
    collectColumnsFromExperiment(acc, experiment)
    collectExperimentIntoCheckpoints(experiments, checkpointsByTip, experiment)
  }
  addCheckpointsToTips(experiments, checkpointsByTip)

  const branch = { baseline, experiments, name }
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

const collectFromRepo = (
  tableData: ExperimentsRepoJSONOutput
): ExperimentsAccumulator => {
  const { workspace, ...branchesObject } = tableData
  const acc: ExperimentsAccumulator = {
    branches: [] as ExperimentsBranch[],
    checkpointsByTip: new Map(),
    metricsMap: new Map(),
    paramsMap: new Map(),
    workspace
  }
  collectColumnsFromExperiment(acc, workspace.baseline)
  collectFromBranchesObject(acc, branchesObject)
  return acc
}

export const transformExperimentsRepo = (
  tableData: ExperimentsRepoJSONOutput
): TransformedExperiments => {
  const { metricsMap, paramsMap, branches, workspace } =
    collectFromRepo(tableData)

  return {
    branches,
    metrics: transformAndCollectFromColumnsIfAny(metricsMap),
    params: transformAndCollectFromColumnsIfAny(paramsMap),
    workspace
  } as TransformedExperiments
}
