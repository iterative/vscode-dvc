import {
  ExperimentsRepoJSONOutput,
  ValueTree,
  Value,
  DataDictRoot,
  ExperimentJSONOutput
} from './contract'

interface BuildColumnsOutput {
  params?: Column[]
  leafParams?: Column[]
  metrics?: Column[]
  leafMetrics?: Column[]
}

interface InferredColumns {
  leafColumns: Column[]
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
  valueTree: ValueTree | DataDictRoot
): PartialColumnsMap => {
  if (!valueTree) {
    return originalColumnsMap
  }
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
  leafColumns: Column[] = [],
  ancestors?: string[]
): Column[] => {
  const currentLevelColumns = []
  for (const entry of columnsMap) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    currentLevelColumns.push(buildColumn(entry, leafColumns, ancestors))
  }
  return currentLevelColumns
}

const transformColumnsMap = (
  columnsMap: PartialColumnsMap
): InferredColumns => {
  const leafColumns: Column[] = []
  const nestedColumns = transformAndCollectFromColumns(columnsMap, leafColumns)
  return { leafColumns, nestedColumns }
}

const buildColumn = (
  entry: [string, PartialColumnDescriptor],
  leafColumns: Column[],
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
      leafColumns,
      ancestors ? [...ancestors, name] : [name]
    )
  } else {
    leafColumns.push(finalColumn)
  }

  return finalColumn
}

interface AggregatedColumns {
  paramsMap: PartialColumnsMap | undefined
  metricsMap: PartialColumnsMap | undefined
}

const walkExperiments = (
  tableData: ExperimentsRepoJSONOutput,
  onExperiment: (commit: ExperimentJSONOutput) => void
) => {
  for (const branch of Object.values(tableData)) {
    for (const commit of Object.values(branch)) {
      onExperiment(commit)
    }
  }
}

const aggregateColumns = (
  tableData: ExperimentsRepoJSONOutput
): AggregatedColumns => {
  let paramsMap: PartialColumnsMap | undefined
  let metricsMap: PartialColumnsMap | undefined

  walkExperiments(tableData, (commit: ExperimentJSONOutput) => {
    const { params, metrics } = commit
    if (params) {
      paramsMap = mergeOrCreateColumnsMap(paramsMap, params)
    }
    if (metrics) {
      metricsMap = mergeOrCreateColumnsMap(metricsMap, metrics)
    }
  })

  return { metricsMap, paramsMap }
}

const buildColumnsOutput = ({
  paramsMap,
  metricsMap
}: AggregatedColumns): BuildColumnsOutput => {
  const output: BuildColumnsOutput = {}

  if (paramsMap) {
    const { nestedColumns, leafColumns } = transformColumnsMap(paramsMap)
    output.params = nestedColumns
    output.leafParams = leafColumns
  }

  if (metricsMap) {
    const { nestedColumns, leafColumns } = transformColumnsMap(metricsMap)
    output.metrics = nestedColumns
    output.leafMetrics = leafColumns
  }

  return output
}

export const buildColumns = (
  tableData: ExperimentsRepoJSONOutput
): BuildColumnsOutput => {
  return buildColumnsOutput(aggregateColumns(tableData))
}
