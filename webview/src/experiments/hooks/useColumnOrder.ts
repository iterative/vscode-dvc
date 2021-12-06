import { ParamOrMetric } from 'dvc/src/experiments/webview/contract'
import { useMemo } from 'react'

function getColumnsByPath(
  columns: ParamOrMetric[]
): Record<string, ParamOrMetric> {
  const columnsByPath: Record<string, ParamOrMetric> = {}
  for (const column of columns) {
    columnsByPath[column.path] = column
  }
  return columnsByPath
}

function getOrderedData(
  columnsByPath: Record<string, ParamOrMetric>,
  columnOrder: string[]
): ParamOrMetric[] {
  return columnOrder
    .map(path => ({
      ...columnsByPath[path]
    }))
    .filter(Boolean) as ParamOrMetric[]
}

function getOrderedDataWithGroups(
  columns: ParamOrMetric[],
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
      orderedData.push(parentNode as ParamOrMetric)
    }
  })
  return orderedData
}

export const useColumnOrder = (
  params: ParamOrMetric[],
  columnOrder: string[]
): ParamOrMetric[] =>
  useMemo(() => {
    if (params && columnOrder) {
      return getOrderedDataWithGroups(params, columnOrder)
    }
    return []
  }, [params, columnOrder])
