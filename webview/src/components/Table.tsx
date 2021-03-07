import React from 'react'
import { Cell, HeaderGroup } from 'react-table'
import cx from 'classnames'
import { InstanceProp, RowProp } from './Experiments'
import { Experiment } from '../util/parse-experiments'
import styles from './table-styles.module.scss'

export const ParentHeaderGroup: React.FC<{
  headerGroup: HeaderGroup<Experiment>
}> = ({ headerGroup }) => {
  return (
    <div
      {...headerGroup.getHeaderGroupProps({
        className: cx(styles.parentHeadersRow, styles.tr)
      })}
    >
      {headerGroup.headers.map(column => (
        <div
          {...column.getHeaderProps({
            className: cx(
              styles.th,
              column.placeholderOf
                ? styles.placeholderHeaderCell
                : styles.parentHeaderCell,
              column.isGrouped && styles.groupedHeader
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

export const FirstCell: React.FC<{ cell: Cell<Experiment, unknown> }> = ({
  cell
}) => {
  const { row } = cell

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
  const firstCellProps = row.canExpand
    ? row.getToggleRowExpandedProps({
        ...baseFirstCellProps,
        className: cx(
          baseFirstCellProps.className,
          styles.expandableExperimentCell,
          row.isExpanded
            ? styles.expandedExperimentCell
            : styles.contractedExperimentCell
        )
      })
    : baseFirstCellProps

  return (
    <div {...firstCellProps}>
      <span
        className={
          row.canExpand
            ? row.isExpanded
              ? styles.expandedRowArrow
              : styles.contractedRowArrow
            : styles.rowArrowPlaceholder
        }
      />
      <span
        className={row.original.queued ? styles.queuedBullet : styles.bullet}
      />
      {cell.isPlaceholder ? null : cell.render('Cell')}
    </div>
  )
}

export const PrimaryHeaderGroup: React.FC<{
  headerGroup: HeaderGroup<Experiment>
}> = ({ headerGroup }) => (
  <div
    {...headerGroup.getHeaderGroupProps({
      className: cx(styles.tr, styles.headersRow)
    })}
  >
    {headerGroup.headers.map(header => (
      <div
        {...header.getHeaderProps(
          header.getSortByToggleProps({
            className: cx(
              styles.th,
              header.isGrouped && styles.groupedHeader,
              header.isSorted && styles.sortedHeader
            )
          })
        )}
        key={header.id}
      >
        <div>
          {header.render('Header')}
          {header.isSorted && <span>{header.isSortedDesc ? '↓' : '↑'}</span>}
        </div>
      </div>
    ))}
  </div>
)

export const RowContent: React.FC<RowProp & { className?: string }> = ({
  row,
  className
}) => {
  const [firstCell, ...cells] = row.cells
  return (
    <div
      {...row.getRowProps({
        className: cx(
          className,
          styles.tr,
          row.flatIndex % 2 === 0 || styles.oddRow,
          row.values.id === 'workspace'
            ? styles.workspaceRow
            : styles.normalRow,
          styles.row
        )
      })}
    >
      <FirstCell cell={firstCell} />
      {cells.map(cell => {
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
        row.isExpanded && styles.expandedGroup
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
  const lastHeaderGroupIndex = headerGroups.length - 1
  const lastHeaderGroup = headerGroups[lastHeaderGroupIndex]

  return (
    <div className={styles.thead}>
      {headerGroups.slice(0, lastHeaderGroupIndex).map((headerGroup, i) => (
        <ParentHeaderGroup
          headerGroup={headerGroup}
          key={`header-group-${i}`}
        />
      ))}
      <PrimaryHeaderGroup headerGroup={lastHeaderGroup} />
    </div>
  )
}

export const Table: React.FC<InstanceProp> = ({ instance }) => {
  const { getTableProps, rows } = instance

  return (
    <div className={styles.tableContainer}>
      <div {...getTableProps({ className: styles.table })}>
        <TableHead instance={instance} />
        {rows.map(row => {
          return <TableBody row={row} instance={instance} key={row.id} />
        })}
      </div>
    </div>
  )
}
