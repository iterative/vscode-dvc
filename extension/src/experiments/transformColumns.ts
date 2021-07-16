import { PartialColumnDescriptor, PartialColumnsMap } from './accumulator'
import { ColumnData } from './webview/contract'

const columnFromMapEntry = (
  entry: [string, PartialColumnDescriptor]
): ColumnData => {
  const [name, partialColumnDescriptor] = entry
  const {
    group,
    path,
    hasChildren,
    parentPath,
    types,
    maxStringLength,
    minNumber,
    maxNumber
  } = partialColumnDescriptor
  const column: ColumnData = {
    group,
    hasChildren,
    name,
    parentPath,
    path
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
  columnsMap: PartialColumnsMap
): ColumnData[] => {
  const currentLevelColumns = []
  for (const entry of columnsMap) {
    currentLevelColumns.push(columnFromMapEntry(entry))
  }
  return currentLevelColumns
}

export const transformAndCollectFromColumnsIfAny = (
  columnsMap: PartialColumnsMap
): ColumnData[] =>
  columnsMap.size === 0 ? [] : transformAndCollectFromColumns(columnsMap)
