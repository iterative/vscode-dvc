import { ExperimentsRepoJSONOutput, ValueTree, Value } from './contract'

interface BuildColumnsOutput {
  flatColumns: Column[]
  nestedColumns: Column[]
}

interface PartialColumnDescriptor {
  types?: Set<string>
  maxStringLength?: number
  childColumns?: PartialColumnsMap
}
type PartialColumnsMap = Map<string, PartialColumnDescriptor>

export interface Column {
  name: string
  types?: string[]
  maxStringLength?: number
  childColumns?: Column[]
  ancestors?: string[]
}

const getValueType = (value: Value | ValueTree) => {
  if (value === null) {
    return 'null'
  }
  return typeof value
}

const mergePrimitiveColumn = (
  columnDescriptor: PartialColumnDescriptor,
  newValue: Value
): PartialColumnDescriptor => {
  const { maxStringLength } = columnDescriptor
  const additionStringLength = String(newValue).length
  if (maxStringLength === undefined || maxStringLength < additionStringLength) {
    columnDescriptor.maxStringLength = additionStringLength
  }
  return columnDescriptor as PartialColumnDescriptor
}

const mergeOrCreateColumnsMap = (
  originalColumnsMap: PartialColumnsMap = new Map(),
  valueTree: ValueTree
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
    return mergePrimitiveColumn(columnDescriptor, newValue as Value)
  }
}

const columnFromMapEntry = (
  entry: [string, PartialColumnDescriptor]
): Column => {
  const [name, partialColumnDescriptor] = entry
  const { types, maxStringLength } = partialColumnDescriptor
  const column: Column = {
    name
  }
  if (maxStringLength) {
    column.maxStringLength = maxStringLength
  }
  if (types) {
    column.types = [...types]
  }
  return column
}

const transformAndCollectFromColumns = (
  columnsMap: PartialColumnsMap,
  flatColumns: Column[] = [],
  ancestors?: string[]
): Column[] => {
  const currentLevelColumns = []
  for (const entry of columnsMap) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    currentLevelColumns.push(buildColumn(entry, flatColumns, ancestors))
  }
  return currentLevelColumns
}

const transformColumnsMap = (
  columnsMap: PartialColumnsMap
): BuildColumnsOutput => {
  const flatColumns: Column[] = []
  const nestedColumns = transformAndCollectFromColumns(columnsMap, flatColumns)
  return { flatColumns, nestedColumns }
}

const buildColumn = (
  entry: [string, PartialColumnDescriptor],
  flatColumns: Column[],
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
      flatColumns,
      ancestors ? [...ancestors, name] : [name]
    )
  } else {
    flatColumns.push(finalColumn)
  }

  return finalColumn
}

export const buildColumns = (
  tableData: ExperimentsRepoJSONOutput
): BuildColumnsOutput => {
  let paramsColumn: PartialColumnDescriptor | undefined
  let metricsColumn: PartialColumnDescriptor | undefined

  for (const branch of Object.values(tableData)) {
    for (const commit of Object.values(branch)) {
      const { params, metrics } = commit
      paramsColumn = mergeOrCreateColumnDescriptor(paramsColumn, params)
      metricsColumn = mergeOrCreateColumnDescriptor(metricsColumn, metrics)
    }
  }

  const columns: PartialColumnsMap = new Map()
  if (paramsColumn) {
    columns.set('params', paramsColumn)
  }
  if (metricsColumn) {
    columns.set('metrics', metricsColumn)
  }
  return transformColumnsMap(columns)
}
