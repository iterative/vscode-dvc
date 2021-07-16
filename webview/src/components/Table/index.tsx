import React from 'react'
import { Cell, HeaderGroup, TableInstance, Row } from 'react-table'
import cx from 'classnames'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import styles from './styles.module.scss'

export interface InstanceProp {
  instance: TableInstance<Experiment>
}

export interface RowProp {
  row: Row<Experiment>
}

export const MergedHeaderGroup: React.FC<{
  headerGroup: HeaderGroup<Experiment>
}> = ({ headerGroup }) => {
  return (
    <div
      {...headerGroup.getHeaderGroupProps({
        className: cx(styles.tr)
      })}
    >
      {headerGroup.headers.map(column => (
        <div
          {...column.getHeaderProps({
            className: cx(
              styles.th,
              column.placeholderOf
                ? styles.placeholderHeaderCell
                : styles.headerCell
            )
          })}
          key={column.id}
        >
          <div>{column.render('Header')}</div>
        </div>
      ))}
    </div>
  )
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

export const FirstCell: React.FC<{
  cell: Cell<Experiment, unknown>
}> = ({ cell }) => {
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
      <span className={styles.bullet} />
      {cell.isPlaceholder ? null : cell.render('Cell')}
    </div>
  )
}

const getCells = (cells: Cell<Experiment, unknown>[]) =>
  cells.map(cell => {
    return (
      <div
        {...cell.getCellProps({
          className: cx(
            styles.td,
            cell.isPlaceholder && styles.groupPlaceholder,
            cell.column.isGrouped && styles.groupedColumnCell,
            cell.isGrouped && styles.groupedCell
          )
        })}
        key={`${cell.column.id}___${cell.row.id}`}
      >
        {cell.isPlaceholder ? null : cell.render('Cell')}
      </div>
    )
  })

const getExperimentTypeClass = ({ running, queued }: Experiment) => {
  if (running) {
    return styles.runningExperiment
  }
  if (queued) {
    return styles.queuedExperiment
  }
  return styles.normalExperiment
}

export const RowContent: React.FC<RowProp & { className?: string }> = ({
  row: {
    getRowProps,
    cells: [firstCell, ...cells],
    original,
    flatIndex,
    values: { id }
  },
  className
}): JSX.Element => (
  <div
    {...getRowProps({
      className: cx(
        className,
        styles.tr,
        getExperimentTypeClass(original),
        flatIndex % 2 === 0 || styles.oddRow,
        id === 'workspace' ? styles.workspaceRow : styles.normalRow,
        styles.row
      )
    })}
  >
    <FirstCell cell={firstCell} />
    {getCells(cells)}
  </div>
)

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

export const TableBody: React.FC<RowProp & InstanceProp> = ({
  row,
  instance
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
      <RowContent row={row} />
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

export const TableHead: React.FC<InstanceProp> = ({
  instance: { headerGroups }
}) => {
  return (
    <div className={styles.thead}>
      {headerGroups.map((headerGroup, i) => (
        <MergedHeaderGroup
          headerGroup={headerGroup}
          key={`header-group-${i}`}
        />
      ))}
    </div>
  )
}

export const Table: React.FC<InstanceProp> = ({ instance }) => {
  const { getTableProps, rows } = instance

  return (
    <div className={styles.tableContainer}>
      <div {...getTableProps({ className: styles.table })}>
        <TableHead instance={instance} />
        {rows.map(row => (
          <TableBody row={row} instance={instance} key={row.id} />
        ))}
      </div>
    </div>
  )
}
