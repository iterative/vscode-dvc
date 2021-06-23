import {
  ExperimentsRepoJSONOutput,
  Value,
  ValueTree,
  Experiment,
  ExperimentsBranchJSONOutput
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
  checkpointTips: Experiment[]
}

export interface TransformedExperiments {
  metrics?: Column[]
  params?: Column[]
  checkpointTips: Experiment[]
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

const aggregateExperiment = (
  acc: ExperimentsAccumulator,
  experiment: Experiment
) => {
  const { params, metrics, checkpoint_tip, sha } = experiment
  const { paramsMap, metricsMap, checkpointsByTip, checkpointTips } = acc
  if (params) {
    mergeColumnsMap(paramsMap, params)
  }
  if (metrics) {
    mergeColumnsMap(metricsMap, metrics)
  }
  if (checkpoint_tip && checkpoint_tip !== sha) {
    addToMapArray(checkpointsByTip, checkpoint_tip, experiment)
  } else {
    checkpointTips.push(experiment)
  }

  return acc
}

const aggregateBranch = (
  acc: ExperimentsAccumulator,
  branch: ExperimentsBranchJSONOutput
) =>
  Object.entries(branch).reduce(
    (acc, [sha, experiment]) =>
      aggregateExperiment(acc, { sha, ...experiment }),
    acc
  )

const aggregateExperimentsRepo = (
  tableData: ExperimentsRepoJSONOutput
): ExperimentsAccumulator =>
  Object.values(tableData).reduce(aggregateBranch, {
    checkpointTips: [],
    checkpointsByTip: new Map(),
    metricsMap: new Map(),
    paramsMap: new Map()
  } as ExperimentsAccumulator)

export const transformExperimentsRepo = (
  tableData: ExperimentsRepoJSONOutput
): TransformedExperiments => {
  const { metricsMap, paramsMap, checkpointsByTip, checkpointTips } =
    aggregateExperimentsRepo(tableData)
  for (const tip of checkpointTips) {
    const checkpoints = checkpointsByTip.get(tip.sha as string)
    if (checkpoints) {
      tip.checkpoints = checkpoints
    }
  }
  return {
    checkpointTips,
    metrics: transformAndCollectFromColumnsIfAny(metricsMap),
    params: transformAndCollectFromColumnsIfAny(paramsMap)
  }
}
