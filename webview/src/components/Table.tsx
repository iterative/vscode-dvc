import React, { useState } from 'react'
import { Cell, HeaderGroup, TableInstance, Row } from 'react-table'
import cx from 'classnames'
import { Experiment } from '../util/parse-experiments'
import styles from './table-styles.module.scss'
import { Menu, MenuToggle, MenuItemGroup, MenuItem } from './Menu/Menu'

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
}> = ({ headerGroup }) => {
  const [isOpen, setIsOpen] = useState(false)

  const onToggle = (isOpen: any) => {
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
                  <span>
                    {header.isSorted &&
                      (header.isSortedDesc ? (
                        <svg
                          fill="currentColor"
                          height="1em"
                          width="1em"
                          viewBox="0 0 256 512"
                          aria-hidden="true"
                          role="img"
                          style={{ verticalAlign: -0.125 + 'em' }}
                        >
                          <path d="M168 345.941V44c0-6.627-5.373-12-12-12h-56c-6.627 0-12 5.373-12 12v301.941H41.941c-21.382 0-32.09 25.851-16.971 40.971l86.059 86.059c9.373 9.373 24.569 9.373 33.941 0l86.059-86.059c15.119-15.119 4.411-40.971-16.971-40.971H168z"></path>
                        </svg>
                      ) : (
                        <svg
                          fill="currentColor"
                          height="1em"
                          width="1em"
                          viewBox="0 0 256 512"
                          aria-hidden="true"
                          role="img"
                          style={{ verticalAlign: -0.125 + 'em' }}
                        >
                          <path d="M88 166.059V468c0 6.627 5.373 12 12 12h56c6.627 0 12-5.373 12-12V166.059h46.059c21.382 0 32.09-25.851 16.971-40.971l-86.059-86.059c-9.373-9.373-24.569-9.373-33.941 0l-86.059 86.059c-15.119 15.119-4.411 40.971 16.971 40.971H88z"></path>
                        </svg>
                      ))}
                  </span>
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
