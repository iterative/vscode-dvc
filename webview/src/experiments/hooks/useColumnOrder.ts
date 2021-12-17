import { MetricOrParam } from 'dvc/src/experiments/webview/contract'
import { useMemo } from 'react'

function getColumnsByPath(
  columns: MetricOrParam[]
): Record<string, MetricOrParam> {
  const columnsByPath: Record<string, MetricOrParam> = {}
  for (const column of columns) {
    columnsByPath[column.path] = column
  }
  return columnsByPath
}

function getOrderedData(
  columnsByPath: Record<string, MetricOrParam>,
  columnOrder: string[]
): MetricOrParam[] {
  return columnOrder
    .map(path => ({
      ...columnsByPath[path]
    }))
    .filter(Boolean) as MetricOrParam[]
}

function getOrderedDataWithGroups(
  columns: MetricOrParam[],
  columnOrder: string[]
) {
  const columnsByPath = getColumnsByPath(columns)
  const orderedData = [...getOrderedData(columnsByPath, columnOrder)]
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
      orderedData.push(parentNode as MetricOrParam)
    }
  })
  return orderedData
}

export const useColumnOrder = (
  params: MetricOrParam[],
  columnOrder: string[]
): MetricOrParam[] =>
  useMemo(() => {
    if (params && columnOrder) {
      return getOrderedDataWithGroups(params, columnOrder)
    }
    return []
  }, [params, columnOrder])
