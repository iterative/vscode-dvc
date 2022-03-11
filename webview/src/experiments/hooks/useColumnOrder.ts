import { MetricOrParam } from 'dvc/src/experiments/webview/contract'
import { useMemo } from 'react'

const getColumnsByPath = (
  columns: MetricOrParam[]
): Record<string, MetricOrParam> => {
  const columnsByPath: Record<string, MetricOrParam> = {}
  for (const column of columns) {
    columnsByPath[column.path] = column
  }
  return columnsByPath
}

const getOrderedData = (
  columnsByPath: Record<string, MetricOrParam>,
  columnOrder: string[]
): MetricOrParam[] => {
  return columnOrder
    .map(path => ({
      ...columnsByPath[path]
    }))
    .filter(Boolean) as MetricOrParam[]
}

const collectParentNode = (
  orderedData: MetricOrParam[],
  parentPath: string,
  groupNumberPrefix: string,
  columnsByPath: Record<string, MetricOrParam>
) => {
  const parentNode = {
    ...columnsByPath[parentPath]
  }
  parentNode.path = groupNumberPrefix + parentPath

  if (!orderedData.some(column => column.path === parentNode.path)) {
    orderedData.push(parentNode as MetricOrParam)
  }
}

const collectOrderedData = (
  orderedData: MetricOrParam[],
  previousGroups: string[],
  previousGroup: string,
  columnsByPath: Record<string, MetricOrParam>
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
  columns: MetricOrParam[],
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
  params: MetricOrParam[],
  columnOrder: string[]
): MetricOrParam[] =>
  useMemo(() => {
    if (params && columnOrder) {
      return collectOrderedDataWithGroups(params, columnOrder)
    }
    return []
  }, [params, columnOrder])
