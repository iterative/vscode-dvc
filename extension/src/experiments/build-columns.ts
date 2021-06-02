/* eslint-disable @typescript-eslint/no-use-before-define */
import { ExperimentsRepoJSONOutput, ValueTree, Value } from './contract'

export interface IncompleteColumnDescriptor {
  types?: Set<string>
  maxStringLength?: number
  childColumns?: ColumnsMap
}
export type ColumnsMap = Map<string, IncompleteColumnDescriptor>

export interface SerializedColumn {
  name: string
  types?: string[]
  childColumns?: SerializedColumn[]
}

const mergeOrCreateColumnsMap = (
  originalColumnsMap: ColumnsMap = new Map(),
  valueTree: ValueTree
): ColumnsMap => {
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
  columnDescriptor: IncompleteColumnDescriptor,
  newValue: Value
): IncompleteColumnDescriptor => {
  const { maxStringLength } = columnDescriptor
  const additionStringLength = String(newValue).length
  if (maxStringLength === undefined || maxStringLength < additionStringLength) {
    columnDescriptor.maxStringLength = additionStringLength
  }
  return columnDescriptor as IncompleteColumnDescriptor
}

const getValueType = (value: Value | ValueTree) => {
  if (value === null) {
    return 'null'
  }
  return typeof value
}

const mergeOrCreateColumnDescriptor = (
  columnDescriptor: IncompleteColumnDescriptor = {},
  newValue: Value | ValueTree
): IncompleteColumnDescriptor => {
  const newValueType = getValueType(newValue)

  if (newValueType === 'object') {
    columnDescriptor.childColumns = mergeOrCreateColumnsMap(
      columnDescriptor.childColumns,
      newValue as ValueTree
    )
    return columnDescriptor as IncompleteColumnDescriptor
  } else {
    if (!columnDescriptor.types) {
      columnDescriptor.types = new Set()
    }
    const { types } = columnDescriptor
    types.add(newValueType)
    return mergePrimitiveColumn(columnDescriptor, newValue as Value)
  }
}

const serializeColumnMap = (columns: ColumnsMap): SerializedColumn[] =>
  [...columns].map(([name, { types, childColumns, ...rest }]) => {
    const column: SerializedColumn = {
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
): SerializedColumn[] => {
  let paramsColumn: IncompleteColumnDescriptor | undefined
  let metricsColumn: IncompleteColumnDescriptor | undefined

  for (const branch of Object.values(tableData)) {
    for (const commit of Object.values(branch)) {
      const { params, metrics } = commit
      paramsColumn = mergeOrCreateColumnDescriptor(paramsColumn, params)
      metricsColumn = mergeOrCreateColumnDescriptor(metricsColumn, metrics)
    }
  }

  const columns: ColumnsMap = new Map()
  if (paramsColumn) {
    columns.set('params', paramsColumn)
  }
  if (metricsColumn) {
    columns.set('metrics', metricsColumn)
  }
  return serializeColumnMap(columns)
}
