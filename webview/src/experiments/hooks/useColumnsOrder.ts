import {
  ColumnDetail,
  ParamOrMetric
} from 'dvc/src/experiments/webview/contract'
import { Model } from '../model'

function getColumnsByPath(
  columns: ParamOrMetric[]
): Record<string, ParamOrMetric> {
  const columnsByPath: Record<string, ParamOrMetric> = {}
  for (const column of columns) {
    columnsByPath[column.path] = column
  }
  return columnsByPath
}

function getOrderedPaths(columnsOrder: ColumnDetail[]): string[] {
  return (
    columnsOrder
      ?.map(column => column.path)
      .filter(column => !['experiment', 'timestamp'].includes(column)) || []
  )
}

function getOrderedData(
  columnsByPath: Record<string, ParamOrMetric>,
  columnsOrder: ColumnDetail[]
): ParamOrMetric[] {
  const orderedPaths = getOrderedPaths(columnsOrder)
  return orderedPaths
    .map(path => ({
      ...columnsByPath[path]
    }))
    .filter(Boolean) as ParamOrMetric[]
}

function getOrderedDataWithGroups(
  columns: ParamOrMetric[],
  columnsOrder: ColumnDetail[]
) {
  const columnsByPath = getColumnsByPath(columns)
  const orderedData = [...getOrderedData(columnsByPath, columnsOrder)]
  const previousGroups: string[] = []

  let previousGroup = (orderedData?.length && orderedData[0].parentPath) || ''

  orderedData.forEach(node => {
    const { parentPath, path } = node

    if (parentPath !== previousGroup) {
      previousGroups.push(previousGroup)
      previousGroup = parentPath || ''
    }

    const groupNumberPrefix = `${previousGroups.length}/`

    node.path = groupNumberPrefix + path
    node.parentPath = groupNumberPrefix + parentPath

    const parentNode = {
      ...columnsByPath[parentPath]
    }
    parentNode.path = groupNumberPrefix + parentPath

    if (!orderedData.find(column => column.path === parentNode.path)) {
      orderedData.push(parentNode as ParamOrMetric)
    }
  })
  return orderedData
}

function getOrderedDataWithGroupsFromModel(model: Model): ParamOrMetric[] {
  if (model.data) {
    const { columns, columnsOrder } = model.data
    if (columns && columnsOrder) {
      return getOrderedDataWithGroups(columns, columnsOrder)
    }
  }
  return []
}

export const useColumnOrder = (
  modelInstance: Model
): [ParamOrMetric[], (newOrder: string[]) => void] => {
  const columnOrderRepresentation =
    getOrderedDataWithGroupsFromModel(modelInstance)
  const setColumnOrderRepresentation = (newOrder: string[]) =>
    modelInstance.sendColumnsOrder(newOrder)
  return [columnOrderRepresentation, setColumnOrderRepresentation]
}
