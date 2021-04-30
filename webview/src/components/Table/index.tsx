import React from 'react'
import { Cell, HeaderGroup, TableInstance, Row } from 'react-table'
import cx from 'classnames'
import { Experiment } from '../../util/parse-experiments'
import styles from './styles.module.scss'
import { Menu, MenuToggle, MenuItemGroup, MenuItem } from '../Menu'
import SortIconToggle from '../SortIconToggle'

export interface InstanceProp {
  instance: TableInstance<Experiment>
}

export interface RowProp {
  row: Row<Experiment>
}

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

export const FirstCell: React.FC<{ cell: Cell<Experiment, unknown> }> = ({
  cell
}) => {
  const { row } = cell

  const firstCellProps = getFirstCellProps(cell, row)

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
}> = ({ headerGroup }) => {
  const [isOpen, setIsOpen] = React.useState(false)

  const onToggle = (isOpen: boolean) => {
    setIsOpen(isOpen)
  }

  return (
    <div
      {...headerGroup.getHeaderGroupProps({
        className: cx(styles.tr, styles.headersRow)
      })}
    >
      {headerGroup.headers.map(header => (
        <div key={`sort-header-${header.id}`}>
          <Menu
            id={`sort-menu-${header.id}`}
            key={`sort-menu-${header.id}`}
            menuItems={[
              <MenuItemGroup
                key={`sort-menu-item-group-${header.id}`}
                id={`sort-menu-item-group-${header.id}`}
              >
                <MenuItem
                  id={'Sort'}
                  isSelected={header.isSorted}
                  {...header.getHeaderProps(
                    header.getSortByToggleProps({
                      key: `sort-menu-item-asc_${header.id}`
                    })
                  )}
                >
                  Sort Column
                  {header.isSorted && (
                    <SortIconToggle isSortedDesc={header.isSortedDesc} />
                  )}
                </MenuItem>
                <MenuItem
                  id={'Visibility'}
                  key={`sort-menu-item-visibility-${header.id}`}
                  onClick={() => header.toggleHidden()}
                >
                  Hide Column
                </MenuItem>
              </MenuItemGroup>
            ]}
            isOpen={isOpen}
            toggle={
              <MenuToggle
                onToggle={onToggle}
                toggleTemplate={header.Header}
                id="toggle"
                key={`sort-toggle-${header.id}`}
              />
            }
          />
        </div>
      ))}
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

export const RowContent: React.FC<RowProp & { className?: string }> = ({
  row,
  className
}): JSX.Element => {
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
      {getCells(cells)}
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
      {/* {headerGroups.slice(0, lastHeaderGroupIndex).map((headerGroup, i) => (
        <ParentHeaderGroup
          headerGroup={headerGroup}
          key={`header-group-${i}`}
        />
      ))} */}
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
