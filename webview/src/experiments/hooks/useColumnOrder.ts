import { Column } from 'dvc/src/experiments/webview/contract'
import { useMemo } from 'react'

const getColumnsByPath = (columns: Column[]): Record<string, Column> => {
  const columnsByPath: Record<string, Column> = {}
  for (const column of columns) {
    columnsByPath[column.path] = column
  }
  return columnsByPath
}

const getOrderedData = (
  columnsByPath: Record<string, Column>,
  columnOrder: string[]
): Column[] => {
  return columnOrder
    .map(path => ({
      ...columnsByPath[path]
    }))
    .filter(Boolean) as Column[]
}

const collectParentNode = (
  orderedData: Column[],
  parentPath: string,
  groupNumberPrefix: string,
  columnsByPath: Record<string, Column>
) => {
  const parentNode = {
    ...columnsByPath[parentPath]
  }
  parentNode.path = groupNumberPrefix + parentPath

  if (!orderedData.some(column => column.path === parentNode.path)) {
    orderedData.push(parentNode as Column)
  }
}

const collectOrderedData = (
  orderedData: Column[],
  previousGroups: string[],
  previousGroup: string,
  columnsByPath: Record<string, Column>
) => {
  const copy = [...orderedData]
  for (const node of copy) {
    const { parentPath, path } = node

    if (parentPath !== previousGroup) {
      previousGroups.push(previousGroup)
      previousGroup = parentPath || ''
    }

    const groupNumberPrefix = `${previousGroups.length}/`

    node.path = groupNumberPrefix + path
    node.parentPath = groupNumberPrefix + parentPath

    collectParentNode(orderedData, parentPath, groupNumberPrefix, columnsByPath)
  }
}

const collectOrderedDataWithGroups = (
  columns: Column[],
  columnOrder: string[]
) => {
  const columnsByPath = getColumnsByPath(columns)
  const orderedData = [...getOrderedData(columnsByPath, columnOrder)]
  const previousGroups: string[] = []

  const previousGroup = (orderedData?.length && orderedData[0].parentPath) || ''

  collectOrderedData(orderedData, previousGroups, previousGroup, columnsByPath)

  return orderedData
}

export const useColumnOrder = (
  params: Column[],
  columnOrder: string[]
): Column[] =>
  useMemo(() => {
    if (params && columnOrder) {
      return collectOrderedDataWithGroups(params, columnOrder)
    }
    return []
  }, [params, columnOrder])
