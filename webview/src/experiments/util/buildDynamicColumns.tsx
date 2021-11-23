import React from 'react'
import get from 'lodash/get'
import { Column, Accessor } from 'react-table'
import { splitParamOrMetricPath } from 'dvc/src/experiments/paramsAndMetrics/paths'
import { Experiment, ParamOrMetric } from 'dvc/src/experiments/webview/contract'
import { formatFloat } from './numberFormatting'
import styles from '../components/Table/styles.module.scss'
import { CopyButton } from '../components/CopyButton'

type Value = string | number
type FullColumn = Column<Experiment> & {
  columns?: Column<Experiment>[]
  sortType?: string
  type?: string[]
  parent?: Column<Experiment>
  placeholderOf?: Column<Experiment>
}

const UndefinedCell = <>. . .</>

const Cell: React.FC<{ value: Value }> = ({ value }) => {
  if (value === undefined) {
    return UndefinedCell
  }

  const displayValue =
    typeof value === 'number' && !Number.isInteger(value)
      ? formatFloat(value as number)
      : String(value)

  return (
    <>
      <span className={styles.cellContents}>{displayValue}</span>
      <CopyButton value={displayValue} />
    </>
  )
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

      const column: FullColumn = {
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

const findMaxDepth = (columns: FullColumn[], depth = 1): number =>
  columns.reduce(
    (prev: number, curr: FullColumn) =>
      curr.columns
        ? Math.max(prev, findMaxDepth(curr.columns, depth + 1))
        : depth,
    1
  )

const findDeepest = (
  depth: number,
  columns: Column<Experiment>[] | undefined,
  maxDepth: number
) => (!depth && columns ? findMaxDepth(columns) : maxDepth)

const fixColumnsNesting = (
  columns: FullColumn[],
  parent?: Column<Experiment>,
  depth = 0,
  maxDepth = 0
) =>
  columns.map((column: FullColumn) => {
    const deepest = findDeepest(depth, column.columns, maxDepth)
    const needsPlaceholder = deepest > depth

    if (column.columns || needsPlaceholder) {
      const newDepth = depth + 1
      const nextColumns = column.columns || [{ ...column }]

      if (!column.columns) {
        column = {
          Header: '',
          id: `${column.id}_previous_placeholder`,
          parent,
          placeholderOf: column
        }
      }

      column.columns = fixColumnsNesting(nextColumns, column, newDepth, deepest)
    }

    return column
  })

const buildColumns = (properties: ParamOrMetric[], parentPath: string) =>
  fixColumnsNesting(buildDynamicColumns(properties, parentPath))

export default buildColumns
