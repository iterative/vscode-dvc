import React from 'react'
import get from 'lodash/get'
import { Column, Accessor } from 'react-table'
import { ColumnData } from 'dvc/src/experiments/webview/contract'
import { formatFloat } from './number-formatting'
import { Experiment } from '../../../extension/src/experiments/contract'

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

const getCellComponent = (): React.FC<{ value: Value }> => Cell

const buildColumnIdFromPath = (objectPath: string[]) =>
  objectPath.map(segment => `[${segment}]`).join('')

const buildAccessor: (valuePath: string[]) => Accessor<Experiment> =
  pathArray => originalRow =>
    get(originalRow, pathArray)

const buildDynamicColumns = (properties: ColumnData[]): Column<Experiment>[] =>
  properties.map(data => {
    const { path } = data
    const Cell = getCellComponent()
    const column: Column<Experiment> & {
      columns?: Column<Experiment>[]
      sortType?: string
      type?: string[]
    } = {
      Cell,
      Header: data.name,
      accessor: buildAccessor(path),
      columns: data?.childColumns?.length
        ? buildDynamicColumns(data.childColumns)
        : undefined,
      id: buildColumnIdFromPath(path),
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

export default buildDynamicColumns
