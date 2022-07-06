import React, { SyntheticEvent } from 'react'
import get from 'lodash/get'
import {
  Column as TableColumn,
  Accessor,
  ColumnGroup,
  ColumnInstance,
  Cell
} from 'react-table'
import { Experiment, Column } from 'dvc/src/experiments/webview/contract'
import { formatFloat } from './numberFormatting'
import Tooltip, {
  CELL_TOOLTIP_DELAY
} from '../../shared/components/tooltip/Tooltip'
import styles from '../components/table/styles.module.scss'
import { CopyButton } from '../../shared/components/copyButton/CopyButton'
import { OverflowHoverTooltip } from '../components/overflowHoverTooltip/OverflowHoverTooltip'
const UndefinedCell = (
  <div className={styles.innerCell}>
    <span className={styles.cellContents}>. . .</span>
  </div>
)

const CellTooltip: React.FC<{
  stringValue: string
}> = ({ stringValue }) => {
  const stopPropagation = (e: SyntheticEvent) => e.stopPropagation()
  return (
    <div
      className={styles.cellTooltip}
      role="textbox"
      tabIndex={0}
      onClick={stopPropagation}
      onKeyDown={stopPropagation}
    >
      {stringValue}
    </div>
  )
}

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
    <Tooltip
      content={<CellTooltip stringValue={stringValue} />}
      placement="bottom"
      arrow={true}
      delay={[CELL_TOOLTIP_DELAY, 0]}
      interactive={true}
    >
      <div className={styles.innerCell}>
        <CopyButton
          value={stringValue}
          className={styles.copyButton}
          tooltip="Copy cell contents"
        />
        <span className={styles.cellContents}>{displayValue}</span>
      </div>
    </Tooltip>
  )
}

const Header: React.FC<{ column: TableColumn<Experiment> }> = ({
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
  pathArray => originalRow => {
    const value = get(originalRow, pathArray)
    if (!Array.isArray(value)) {
      return value
    }
    return `[${value.join(', ')}]`
  }

const buildDynamicColumns = (
  properties: Column[],
  parentPath: string
): TableColumn<Experiment>[] =>
  properties
    .filter(column => column.parentPath === parentPath)
    .map(data => {
      const { path, type, pathArray, label } = data

      const childColumns = buildDynamicColumns(properties, path)

      return {
        Cell,
        Header,
        accessor: pathArray && buildAccessor(pathArray),
        columns: childColumns.length > 0 ? childColumns : undefined,
        group: type,
        id: path,
        name: label
      } as ColumnGroup<Experiment> | TableColumn<Experiment>
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
  columns: TableColumn<Experiment>[],
  parent?: TableColumn<Experiment>,
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

const buildColumns = (properties: Column[], parentPath: string) =>
  fixColumnsNesting(buildDynamicColumns(properties, parentPath))

export default buildColumns
