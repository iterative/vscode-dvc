import React from 'react'
import get from 'lodash/get'
import { Column, Accessor, ColumnGroup, ColumnInstance } from 'react-table'
import { Experiment, MetricOrParam } from 'dvc/src/experiments/webview/contract'
import styles from '../components/table/styles.module.scss'
import { OverflowHoverTooltip } from '../components/overflowHoverTooltip/OverflowHoverTooltip'
import { CellComponent } from '../components/cell/Cell'

const Header: React.FC<{ column: Column<Experiment> }> = ({
  column: { name }
}) => {
  return (
    <OverflowHoverTooltip content={name}>
      <div className={styles.headerCellWrapper}>
        <span>{name}</span>
      </div>
    </OverflowHoverTooltip>
  )
}

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
      const { path, group, pathArray, name } = data

      const childColumns = buildDynamicColumns(properties, path)

      const column: ColumnGroup<Experiment> | Column<Experiment> = {
        Cell: CellComponent,
        Header,
        accessor: pathArray && buildAccessor(pathArray),
        columns: childColumns.length > 0 ? childColumns : undefined,
        group,
        id: path,
        name
      }
      return column
    })

const findMaxDepth = (columns: ColumnGroup<Experiment>[], depth = 1): number =>
  Math.max(
    ...columns.map(column =>
      column.columns
        ? findMaxDepth(column.columns as ColumnGroup<Experiment>[], depth + 1)
        : depth
    )
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
