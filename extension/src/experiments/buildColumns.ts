import {
  ExperimentsRepoJSONOutput,
  ValueTree,
  Value,
  ValueTreeRoot,
  ExperimentJSONOutput,
  ExperimentsBranchJSONOutput
} from './contract'

interface BuildColumnsOutput {
  params?: Column[]
  metrics?: Column[]
}

interface InferredColumns {
  nestedColumns: Column[]
}

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

interface ExperimentsAggregate {
  paramsMap: PartialColumnsMap | undefined
  metricsMap: PartialColumnsMap | undefined
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

const mergeOrCreateColumnsMap = (
  originalColumnsMap: PartialColumnsMap = new Map(),
  valueTree: ValueTree | ValueTreeRoot
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
    columnDescriptor.childColumns = mergeOrCreateColumnsMap(
      columnDescriptor.childColumns,
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
  const {
    types,
    maxStringLength,
    minNumber,
    maxNumber
  } = partialColumnDescriptor
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

const transformColumnsMap = (
  columnsMap: PartialColumnsMap
): InferredColumns => {
  const nestedColumns = transformAndCollectFromColumns(columnsMap)
  return { nestedColumns }
}

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

const aggregateExperiment = (
  { paramsMap, metricsMap }: ExperimentsAggregate,
  { params, metrics }: ExperimentJSONOutput
) => ({
  metricsMap: metrics
    ? mergeOrCreateColumnsMap(metricsMap, metrics)
    : metricsMap,
  paramsMap: params ? mergeOrCreateColumnsMap(paramsMap, params) : paramsMap
})

const aggregateBranch = (
  acc: ExperimentsAggregate,
  branch: ExperimentsBranchJSONOutput
) => Object.values(branch).reduce(aggregateExperiment, acc)

const aggregateExperimentsRepo = (
  tableData: ExperimentsRepoJSONOutput
): ExperimentsAggregate =>
  Object.values(tableData).reduce(aggregateBranch, {} as ExperimentsAggregate)

const buildColumnsOutput = ({
  paramsMap,
  metricsMap
}: ExperimentsAggregate) => {
  const output: BuildColumnsOutput = {}

  if (paramsMap) {
    const { nestedColumns } = transformColumnsMap(paramsMap)
    output.params = nestedColumns
  }

  if (metricsMap) {
    const { nestedColumns } = transformColumnsMap(metricsMap)
    output.metrics = nestedColumns
  }

  return output
}

export const buildColumns = (tableData: ExperimentsRepoJSONOutput) => {
  const aggregate = aggregateExperimentsRepo(tableData)
  return buildColumnsOutput(aggregate)
}
