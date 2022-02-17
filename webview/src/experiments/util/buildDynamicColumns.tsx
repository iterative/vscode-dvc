import React from 'react'
import get from 'lodash/get'
import { Column, Accessor, ColumnGroup, ColumnInstance } from 'react-table'
import { Experiment, MetricOrParam } from 'dvc/src/experiments/webview/contract'
import { formatFloat } from './numberFormatting'
import styles from '../components/Table/styles.module.scss'
import { CopyButton } from '../components/CopyButton'

type Value = string | number

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
      <CopyButton value={displayValue} />
      <span className={styles.cellContents}>{displayValue}</span>
    </>
  )
}

const Header: React.FC<{ column: Column<Experiment> }> = ({
  column: { name }
}) => {
  return (
    <div className={styles.headerCellContentsWrapper}>
      <span title={name}>{name}</span>
    </div>
  )
}

const getCellComponent = (): React.FC<{ value: Value }> => Cell

const buildAccessor: (valuePath: string[]) => Accessor<Experiment> =
  pathArray => originalRow =>
    get(originalRow, pathArray)

const buildDynamicColumns = (
  properties: MetricOrParam[],
  parentPath: string
): Column<Experiment>[] =>
  properties
    .filter(column => column.parentPath === parentPath)
    .map(data => {
      const { path, group, pathArray } = data

      const Cell = getCellComponent()
      const childColumns = buildDynamicColumns(properties, path)

      const column: ColumnGroup<Experiment> | Column<Experiment> = {
        Cell,
        Header,
        accessor: pathArray && buildAccessor(pathArray),
        columns: childColumns.length ? childColumns : undefined,
        group,
        id: path,
        name: data.name
      }
      return column
    })

const findMaxDepth = (columns: ColumnGroup<Experiment>[], depth = 1): number =>
  columns.reduce(
    (prev: number, curr: ColumnGroup<Experiment>) =>
      Math.max(
        prev,
        curr.columns
          ? findMaxDepth(curr.columns as ColumnGroup<Experiment>[], depth + 1)
          : depth
      ),
    1
  )

const findDeepest = (
  depth: number,
  columns: ColumnGroup<Experiment>[] | undefined,
  maxDepth: number
) => (!depth && columns ? findMaxDepth(columns) : maxDepth)

const fixColumnsNesting = (
  columns: Column<Experiment>[],
  parent?: Column<Experiment>,
  depth = 0,
  maxDepth = 0
) =>
  (columns as ColumnGroup<Experiment>[]).map(
    (column: ColumnGroup<Experiment>) => {
      const deepest = findDeepest(
        depth,
        column.columns as ColumnGroup<Experiment>[],
        maxDepth
      )
      const needsPlaceholder = deepest > depth

      if (column.columns || needsPlaceholder) {
        const newDepth = depth + 1
        const nextColumns = (column.columns || [
          { ...column }
        ]) as ColumnGroup<Experiment>[]

        if (!column.columns) {
          ;(column as Partial<ColumnInstance<Experiment>>) = {
            Header: '',
            id: `${column.id}_previous_placeholder`,
            parent: parent as ColumnInstance<Experiment>,
            placeholderOf: column as ColumnInstance<{}>
          }
        }

        column.columns = fixColumnsNesting(
          nextColumns,
          column,
          newDepth,
          deepest
        )
      }

      return column
    }
  )

const buildColumns = (properties: MetricOrParam[], parentPath: string) =>
  fixColumnsNesting(buildDynamicColumns(properties, parentPath))

export default buildColumns
