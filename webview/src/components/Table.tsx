import React from 'react'
import { Cell, HeaderGroup } from 'react-table'
import cx from 'classnames'
import { InstanceProp, RowProp, DVCExperimentRow } from './Experiments'
import styles from './table-styles.module.scss'

export const ParentHeaderGroup: React.FC<{
  headerGroup: HeaderGroup<DVCExperimentRow>
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

export const FirstCell: React.FC<{ cell: Cell<DVCExperimentRow, any> }> = ({
  cell
}) => {
  const { row } = cell
  const { depth } = row
  const baseFirstCellProps = cell.getCellProps({
    className: cx(
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
        className={styles.depthSpacer}
        style={{
          width: `${depth}em`,
          backgroundColor: 'green',
          display: 'inline-block'
        }}
      ></span>
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
  headerGroup: HeaderGroup<DVCExperimentRow>
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
      >
        <div>
          {header.render('Header')}
          {header.isSorted && <span>{header.isSortedDesc ? '↓' : '↑'}</span>}
        </div>
      </div>
    ))}
  </div>
)

export const Row: React.FC<RowProp> = ({ row }) => {
  const [firstCell, ...cells] = row.cells
  return (
    <div
      {...row.getRowProps({
        className: cx(
          styles.tr,
          row.values.sha === 'workspace'
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
  return (
    <>
      {row.isExpanded &&
        row.subRows.map(row => <NestedRow row={row} instance={instance} />)}
      <Row row={row} />
    </>
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
          row.values.sha === 'workspace'
            ? styles.workspaceRowGroup
            : styles.normalRowGroup
        )
      })}
    >
      <Row row={row} />
      {row.isExpanded &&
        row.subRows.map(subRow => (
          <NestedRow row={subRow} instance={instance} />
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
