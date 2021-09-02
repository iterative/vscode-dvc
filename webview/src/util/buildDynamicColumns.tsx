import React from 'react'
import get from 'lodash/get'
import { Column, Accessor } from 'react-table'
import { Experiment, ParamOrMetric } from 'dvc/src/experiments/webview/contract'
import { formatFloat } from './numberFormatting'
import { splitParamOrMetricPath } from '../../../extension/src/util/paths'

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

const buildAccessor: (valuePath: string[]) => Accessor<Experiment> =
  pathArray => originalRow =>
    get(originalRow, pathArray)

const buildDynamicColumns = (
  properties: ParamOrMetric[],
  parentPath: string
): Column<Experiment>[] =>
  properties
    .filter(column => column.parentPath === parentPath)
    .map(data => {
      const { path } = data
      const Cell = getCellComponent()
      const childColumns = buildDynamicColumns(properties, path)

      const pathArray = splitParamOrMetricPath(path)

      const column: Column<Experiment> & {
        columns?: Column<Experiment>[]
        sortType?: string
        type?: string[]
      } = {
        Cell,
        Header: data.name,
        accessor: buildAccessor(pathArray),
        columns: childColumns.length ? childColumns : undefined,
        id: path,
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
