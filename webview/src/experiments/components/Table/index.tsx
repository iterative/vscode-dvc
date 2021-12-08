import React from 'react'
import { Cell, TableInstance, Row } from 'react-table'
import cx from 'classnames'
import {
  ParamOrMetric,
  RowData as Experiment
} from 'dvc/src/experiments/webview/contract'
import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import styles from './styles.module.scss'
import { TableHead } from './TableHead'
import ClockIcon from '../../../shared/components/icons/Clock'
import { getDisplayNameFromPath } from '../../../util/paths'
export interface InstanceProp {
  instance: TableInstance<Experiment>
}

export interface TableProps extends InstanceProp {
  sorts: SortDefinition[]
  columns: ParamOrMetric[]
}

export interface WithChanges {
  changes?: string[]
}

export interface RowProp {
  row: Row<Experiment>
}

const getFirstCellProps = (
  cell: Cell<Experiment, unknown>,
  row: Row<Experiment>
) => {
  const baseFirstCellProps = cell.getCellProps({
    className: cx(
      styles.firstCell,
      styles.td,
      styles.experimentCell,
      cell.isPlaceholder && styles.groupPlaceholder,
      cell.column.isGrouped && styles.groupedColumnCell,
      cell.isGrouped && styles.groupedCell
    )
  })

  if (!row.canExpand) {
    return baseFirstCellProps
  }

  return row.getToggleRowExpandedProps({
    ...baseFirstCellProps,
    className: cx(
      baseFirstCellProps.className,
      styles.expandableExperimentCell,
      row.isExpanded
        ? styles.expandedExperimentCell
        : styles.contractedExperimentCell
    )
  })
}

const FirstCell: React.FC<{
  cell: Cell<Experiment, unknown>
  bulletColor?: string
}> = ({ cell, bulletColor }) => {
  const { row } = cell

  const firstCellProps = getFirstCellProps(cell, row)

  return (
    <div {...firstCellProps}>
      <span className={styles.rowArrowPlaceholder}>
        {row.canExpand && (
          <span
            className={
              row.isExpanded
                ? styles.expandedRowArrow
                : styles.contractedRowArrow
            }
          />
        )}
      </span>
      <span className={styles.bullet} style={{ color: bulletColor }}>
        {cell.row.original.queued && <ClockIcon />}
      </span>
      {cell.isPlaceholder ? null : cell.render('Cell')}
    </div>
  )
}

const CellWrapper: React.FC<{
  cell: Cell<Experiment, unknown>
  changes?: string[]
  cellId: string
}> = ({ cell, cellId, changes }) => (
  <div
    {...cell.getCellProps({
      className: cx(
        styles.td,
        cell.isPlaceholder && styles.groupPlaceholder,
        cell.column.isGrouped && styles.groupedColumnCell,
        cell.isGrouped && styles.groupedCell,
        {
          [styles.metaCell]: ['timestamp', 'epochs'].includes(
            getDisplayNameFromPath(cell.column.id)
          ),
          [styles.workspaceChange]: changes?.includes(cell.column.id)
        }
      )
    })}
    data-testid={cellId}
  >
    {cell.isPlaceholder ? null : cell.render('Cell')}
  </div>
)

const getExperimentTypeClass = ({ running, queued, selected }: Experiment) => {
  if (running) {
    return styles.runningExperiment
  }
  if (queued) {
    return styles.queuedExperiment
  }
  if (selected === false) {
    return styles.unselectedExperiment
  }

  return styles.normalExperiment
}

export const RowContent: React.FC<
  RowProp & { className?: string } & WithChanges
> = ({
  row: {
    getRowProps,
    cells: [firstCell, ...cells],
    original,
    flatIndex,
    values: { id }
  },
  className,
  changes
}): JSX.Element => {
  const isWorkspace = id === 'workspace'
  const changesIfWorkspace = isWorkspace ? changes : undefined
  return (
    <div
      {...getRowProps({
        className: cx(
          className,
          styles.tr,
          getExperimentTypeClass(original),
          flatIndex % 2 === 0 || styles.oddRow,
          isWorkspace ? styles.workspaceRow : styles.normalRow,
          styles.row,
          isWorkspace && changes?.length && styles.workspaceWithChanges
        )
      })}
      data-testid={isWorkspace && 'workspace-row'}
    >
      <FirstCell cell={firstCell} bulletColor={original.displayColor} />
      {cells.map(cell => {
        const cellId = `${cell.column.id}___${cell.row.id}`
        return (
          <CellWrapper
            cell={cell}
            changes={changesIfWorkspace}
            key={cellId}
            cellId={cellId}
          />
        )
      })}
    </div>
  )
}

export const NestedRow: React.FC<RowProp & InstanceProp> = ({
  row,
  instance
}) => {
  instance.prepareRow(row)
  return <RowContent row={row} className={styles.nestedRow} />
}

export const ExperimentGroup: React.FC<RowProp & InstanceProp> = ({
  row,
  instance
}) => {
  instance.prepareRow(row)
  return (
    <div
      className={cx(
        styles.experimentGroup,
        row.isExpanded && row.subRows.length > 0 && styles.expandedGroup
      )}
    >
      <NestedRow row={row} instance={instance} />
      {row.isExpanded &&
        row.subRows.map(row => (
          <NestedRow row={row} instance={instance} key={row.id} />
        ))}
    </div>
  )
}

export const TableBody: React.FC<RowProp & InstanceProp & WithChanges> = ({
  row,
  instance,
  changes
}) => {
  instance.prepareRow(row)
  return (
    <div
      {...instance.getTableBodyProps({
        className: cx(
          styles.rowGroup,
          styles.tbody,
          row.values.id === 'workspace'
            ? styles.workspaceRowGroup
            : styles.normalRowGroup
        )
      })}
    >
      <RowContent row={row} changes={changes} />
      {row.isExpanded &&
        row.subRows.map(subRow => (
          <ExperimentGroup
            row={subRow}
            instance={instance}
            key={subRow.values.id}
          />
        ))}
    </div>
  )
}

export const Table: React.FC<TableProps & WithChanges> = ({
  instance,
  sorts,
  changes,
  columns
}) => {
  const { getTableProps, rows } = instance
  return (
    <div className={styles.tableContainer}>
      <div {...getTableProps({ className: styles.table })}>
        <TableHead instance={instance} sorts={sorts} columns={columns} />
        {rows.map(row => (
          <TableBody
            row={row}
            instance={instance}
            key={row.id}
            changes={changes}
          />
        ))}
      </div>
    </div>
  )
}
