/* eslint-disable @typescript-eslint/no-use-before-define */
import { ExperimentsRepoJSONOutput, ValueTree, Value } from './contract'

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
      mergeOrCreateColumnDescriptor(
        originalColumnsMap.get(propertyKey),
        propertyValue
      )
    )
  }
  return originalColumnsMap
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

const getValueType = (value: Value | ValueTree) => {
  if (value === null) {
    return 'null'
  }
  return typeof value
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

const serializeColumnMap = (columns: PartialColumnsMap): Column[] =>
  [...columns].map(([name, { types, childColumns, ...rest }]) => {
    const column: Column = {
      name,
      ...rest
    }
    if (types) {
      column.types = [...types]
    }
    if (childColumns) {
      column.childColumns = serializeColumnMap(childColumns)
    }
    return column
  })

export const buildColumns = (
  tableData: ExperimentsRepoJSONOutput
): Column[] => {
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
  return serializeColumnMap(columns)
}
