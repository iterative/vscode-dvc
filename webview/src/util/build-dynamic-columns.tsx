/* eslint-disable @typescript-eslint/no-use-before-define */
import React from 'react'
import get from 'lodash/get'

import { Column, Accessor } from 'react-table'
import { ColumnData } from 'dvc/src/experiments/webview/contract'

import { ExperimentWithSubRows } from './parse-experiments'
import { formatFloat } from './number-formatting'

type Value = string | number

const UndefinedCell = <>-</>

const Cell: React.FC<{ value: Value }> = ({ value }) => {
  if (value === undefined) {
    return UndefinedCell
  }

  if (typeof value === 'number' && !Number.isInteger(value)) {
    return <>{formatFloat(value as number)}</>
  }
  return <>{String(value)}</>
}

const getCellComponent = (): React.FC<{ value: Value }> => {
  return Cell
}

const buildColumnIdFromPath = (objectPath: string[]) =>
  objectPath.map(segment => `[${segment}]`).join('')

const buildAccessor: (valuePath: string[]) => Accessor<ExperimentWithSubRows> =
  pathArray => originalRow =>
    get(originalRow, pathArray)

const buildColumnsFromSchemaProperties = (
  properties: ColumnData[],
  objectPath: string[] = []
): Column<ExperimentWithSubRows>[] => {
  return properties.map(data => {
    const currentPath = [...objectPath, data.name]
    const Cell = getCellComponent()
    const column: Column<ExperimentWithSubRows> & {
      columns?: Column<ExperimentWithSubRows>[]
      sortType?: string
      type?: string[]
    } = {
      Cell,
      Header: data.name,
      accessor: buildAccessor(currentPath),
      columns: data?.childColumns?.length
        ? buildColumnsFromSchemaProperties(data.childColumns, currentPath)
        : undefined,
      id: buildColumnIdFromPath(currentPath),
      type: data.types
    }
    switch (data.types) {
      case ['integer']:
      case ['number']:
        column.sortType = 'basic'
        break
      default:
    }
    return column
  })
}

const buildDynamicColumnsFromExperiments = (
  params: ColumnData[],
  metrics: ColumnData[]
): Column<ExperimentWithSubRows>[] => {
  return [
    ...buildColumnsFromSchemaProperties(params, ['params']),
    ...buildColumnsFromSchemaProperties(metrics, ['metrics'])
  ]
}

export default buildDynamicColumnsFromExperiments
