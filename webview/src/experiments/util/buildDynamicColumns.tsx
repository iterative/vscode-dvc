import React from 'react'
import get from 'lodash/get'
import {
  Column,
  Accessor,
  ColumnGroup,
  ColumnInstance,
  Cell
} from 'react-table'
import { Experiment, MetricOrParam } from 'dvc/src/experiments/webview/contract'
import Tippy from '@tippyjs/react'
import { formatFloat } from './numberFormatting'
import styles from '../components/Table/styles.module.scss'
import sharedStyles from '../../shared/styles.module.scss'
import { CopyButton } from '../components/CopyButton'
import { OverflowHoverTooltip } from '../../shared/components/overflowHover'

import 'tippy.js/dist/tippy.css'

const UndefinedCell = (
  <div className={styles.innerCell}>
    <span className={styles.cellContents}>. . .</span>
  </div>
)

const groupLabels: Record<string, string> = {
  metrics: 'Metric',
  params: 'Parameter'
}

const CellTooltip: React.FC<{
  cell: Cell<Experiment, string | number>
}> = ({ cell }) => {
  const {
    column: { group },
    value
  } = cell
  return (
    <>
      {groupLabels[group as string]}: {value}
    </>
  )
}

export const CELL_TOOLTIP_DELAY = 1000

const Cell: React.FC<Cell<Experiment, string | number>> = cell => {
  const { value } = cell
  if (value === undefined) {
    return UndefinedCell
  }

  const stringValue = String(value)

  const displayValue =
    typeof value === 'number' && !Number.isInteger(value)
      ? formatFloat(value as number)
      : stringValue

  return (
    <Tippy
      animation={false}
      content={<CellTooltip cell={cell} />}
      className={sharedStyles.menu}
      placement="bottom"
      arrow={true}
      delay={CELL_TOOLTIP_DELAY}
    >
      <div className={styles.innerCell}>
        <CopyButton value={stringValue} />
        <span className={styles.cellContents}>{displayValue}</span>
      </div>
    </Tippy>
  )
}

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
        Cell,
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
