import React, { useRef } from 'react'
import cx from 'classnames'
import styles from './styles.module.scss'
import { TableHead } from './TableHead'
import { BatchSelectionProp, RowContent } from './Row'
import { InstanceProp, RowProp, TableProps, WithChanges } from './interfaces'
import { RowSelectionContext } from './RowSelectionContext'
import { useClickOutside } from '../../../shared/hooks/useClickOutside'

export const NestedRow: React.FC<
  RowProp & InstanceProp & BatchSelectionProp
> = ({
  row,
  instance,
  contextMenuDisabled,
  projectHasCheckpoints,
  batchRowSelection
}) => {
  instance.prepareRow(row)
  return (
    <RowContent
      row={row}
      className={styles.nestedRow}
      contextMenuDisabled={contextMenuDisabled}
      projectHasCheckpoints={projectHasCheckpoints}
      batchRowSelection={batchRowSelection}
    />
  )
}

export const ExperimentGroup: React.FC<
  RowProp & InstanceProp & BatchSelectionProp
> = ({
  row,
  instance,
  contextMenuDisabled,
  projectHasCheckpoints,
  batchRowSelection
}) => {
  instance.prepareRow(row)
  return (
    <div
      className={cx(
        styles.experimentGroup,
        row.isExpanded && row.subRows.length > 0 && styles.expandedGroup
      )}
    >
      <NestedRow
        row={row}
        instance={instance}
        contextMenuDisabled={contextMenuDisabled}
        projectHasCheckpoints={projectHasCheckpoints}
        batchRowSelection={batchRowSelection}
      />
      {row.isExpanded &&
        row.subRows.map(row => (
          <NestedRow
            row={row}
            instance={instance}
            key={row.id}
            contextMenuDisabled={contextMenuDisabled}
            projectHasCheckpoints={projectHasCheckpoints}
            batchRowSelection={batchRowSelection}
          />
        ))}
    </div>
  )
}

export const TableBody: React.FC<
  RowProp & InstanceProp & WithChanges & BatchSelectionProp
> = ({
  row,
  instance,
  changes,
  contextMenuDisabled,
  projectHasCheckpoints,
  batchRowSelection
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
      <RowContent
        row={row}
        projectHasCheckpoints={projectHasCheckpoints}
        changes={changes}
        contextMenuDisabled={contextMenuDisabled}
        batchRowSelection={batchRowSelection}
      />
      {row.isExpanded &&
        row.subRows.map(subRow => (
          <ExperimentGroup
            row={subRow}
            instance={instance}
            key={subRow.values.id}
            contextMenuDisabled={contextMenuDisabled}
            projectHasCheckpoints={projectHasCheckpoints}
            batchRowSelection={batchRowSelection}
          />
        ))}
    </div>
  )
}

export const Table: React.FC<TableProps & WithChanges> = ({
  instance,
  tableData
}) => {
  const { getTableProps, rows, flatRows } = instance
  const {
    filters,
    sorts,
    columns,
    changes,
    hasCheckpoints,
    hasRunningExperiment,
    filteredCounts
  } = tableData

  const { clearSelectedRows, batchSelection, selectedRows } =
    React.useContext(RowSelectionContext)

  const tableRef = useRef<HTMLDivElement>(null)

  const clickOutsideHandler = React.useCallback(() => {
    clearSelectedRows?.()
  }, [clearSelectedRows])

  useClickOutside(tableRef, clickOutsideHandler)

  const batchRowSelection = React.useCallback(
    ({ row: { flatIndex } }: RowProp) => {
      const firstSelection = flatRows.find(
        ({ values: { id } }) => selectedRows[id]
      )

      const firstIndex = firstSelection?.flatIndex || 1

      if (flatIndex >= firstIndex) {
        const batch = flatRows
          .filter(
            row => row.flatIndex > firstIndex && row.flatIndex <= flatIndex
          )
          .map(row => ({ row }))

        batchSelection?.(batch)
      }
    },
    [selectedRows, flatRows, batchSelection]
  )

  return (
    <div className={styles.tableContainer}>
      <div {...getTableProps({ className: styles.table })} ref={tableRef}>
        <TableHead
          instance={instance}
          sorts={sorts}
          filteredCounts={filteredCounts}
          filters={filters}
          columns={columns}
        />
        {rows.map(row => (
          <TableBody
            row={row}
            instance={instance}
            key={row.id}
            changes={changes}
            contextMenuDisabled={hasRunningExperiment}
            projectHasCheckpoints={hasCheckpoints}
            batchRowSelection={batchRowSelection}
          />
        ))}
      </div>
    </div>
  )
}
