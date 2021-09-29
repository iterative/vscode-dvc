import React from 'react'
import { Cell, HeaderGroup, TableInstance, Row } from 'react-table'
import cx from 'classnames'
import { RowData as Experiment } from 'dvc/src/experiments/webview/contract'
import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import styles from './styles.module.scss'
import { getPlaceholder } from '../../util/columns'

export interface InstanceProp {
  instance: TableInstance<Experiment>
}

export interface TableProps extends InstanceProp {
  sorts: SortDefinition[]
}

export interface WithChanges {
  changes?: string[]
}

export interface RowProp {
  row: Row<Experiment>
}

export const MergedHeaderGroup: React.FC<{
  headerGroup: HeaderGroup<Experiment>
  columns: HeaderGroup<Experiment>[]
  sorts: SortDefinition[]
}> = ({ headerGroup, columns, sorts }) => {
  return (
    <div
      {...headerGroup.getHeaderGroupProps({
        className: cx(styles.tr, styles.headerRow)
      })}
    >
      {headerGroup.headers.map(column => {
        const hasPlaceholder = getPlaceholder(column, columns)
        const isSortedWithPlaceholder = (sort: SortDefinition) =>
          sort.path === column.placeholderOf?.id ||
          (!column.placeholderOf && !hasPlaceholder && sort.path === column.id)
        return (
          <div
            {...column.getHeaderProps({
              className: cx(
                styles.th,
                column.placeholderOf
                  ? styles.placeholderHeaderCell
                  : styles.headerCell,
                {
                  [styles.paramHeaderCell]: column.id.includes('params'),
                  [styles.metricHeaderCell]: column.id.includes('metric'),
                  [styles.firstLevelHeader]:
                    column.id.split(':').length - 1 === 1,
                  [styles.sortingHeaderCellAsc]: sorts.filter(
                    sort => !sort.descending && isSortedWithPlaceholder(sort)
                  ).length,
                  [styles.sortingHeaderCellDesc]: sorts.filter(
                    sort => sort.descending && sort.path === column.id
                  ).length
                }
              )
            })}
            key={column.id}
            data-testid={`header-${column.id}`}
          >
            <div>{column.render('Header')}</div>
          </div>
        )
      })}
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

const getCells = (cells: Cell<Experiment, unknown>[], changes?: string[]) =>
  cells.map(cell => (
    <div
      {...cell.getCellProps({
        className: cx(
          styles.td,
          cell.isPlaceholder && styles.groupPlaceholder,
          cell.column.isGrouped && styles.groupedColumnCell,
          cell.isGrouped && styles.groupedCell,
          {
            [styles.metaCell]: ['timestamp', 'epochs'].includes(
              cell.column.id.split(':').reverse()[0]
            ),
            [styles.workspaceChange]:
              cell.column.Header &&
              changes?.includes(cell.column.Header.toString())
          }
        )
      })}
      key={`${cell.column.id}___${cell.row.id}`}
      data-testid={`${cell.column.id}___${cell.row.id}`}
    >
      {cell.isPlaceholder ? null : cell.render('Cell')}
    </div>
  ))

const getExperimentTypeClass = ({ running, queued }: Experiment) => {
  if (running) {
    return styles.runningExperiment
  }
  if (queued) {
    return styles.queuedExperiment
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
      <FirstCell cell={firstCell} />
      {getCells(cells, isWorkspace ? changes : undefined)}
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

export const TableHead: React.FC<TableProps> = ({
  instance: { headerGroups },
  sorts
}) => {
  const allHeaders: HeaderGroup<Experiment>[] = []
  headerGroups.forEach(headerGroup => allHeaders.push(...headerGroup.headers))
  return (
    <div className={styles.thead}>
      {headerGroups.map((headerGroup, i) => (
        <MergedHeaderGroup
          headerGroup={headerGroup}
          columns={allHeaders}
          sorts={sorts}
          key={`header-group-${i}`}
        />
      ))}
    </div>
  )
}

export const Table: React.FC<TableProps & WithChanges> = ({
  instance,
  sorts,
  changes
}) => {
  const { getTableProps, rows } = instance
  return (
    <div className={styles.tableContainer}>
      <div {...getTableProps({ className: styles.table })}>
        <TableHead instance={instance} sorts={sorts} />
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
