import React, { useRef } from 'react'
import cx from 'classnames'
import styles from './styles.module.scss'
import { TableHead } from './TableHead'
import { BatchSelectionProp, RowContent } from './Row'
import {
  InstanceProp,
  RowProp,
  TableProps,
  WithChanges,
  WithTableRoot
} from './interfaces'
import { RowSelectionContext } from './RowSelectionContext'
import { useClickOutside } from '../../../shared/hooks/useClickOutside'

export const NestedRow: React.FC<
  RowProp & InstanceProp & BatchSelectionProp & WithTableRoot
> = ({
  row,
  instance,
  contextMenuDisabled,
  projectHasCheckpoints,
  hasRunningExperiment,
  batchRowSelection,
  root
}) => {
  instance.prepareRow(row)
  return (
    <RowContent
      root={root}
      row={row}
      className={styles.nestedRow}
      contextMenuDisabled={contextMenuDisabled}
      projectHasCheckpoints={projectHasCheckpoints}
      hasRunningExperiment={hasRunningExperiment}
      batchRowSelection={batchRowSelection}
    />
  )
}

export const ExperimentGroup: React.FC<
  RowProp & InstanceProp & BatchSelectionProp & WithTableRoot
> = ({
  row,
  instance,
  contextMenuDisabled,
  projectHasCheckpoints,
  hasRunningExperiment,
  batchRowSelection,
  root
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
        root={root}
        row={row}
        instance={instance}
        contextMenuDisabled={contextMenuDisabled}
        projectHasCheckpoints={projectHasCheckpoints}
        hasRunningExperiment={hasRunningExperiment}
        batchRowSelection={batchRowSelection}
      />
      {row.isExpanded &&
        row.subRows.map(row => (
          <NestedRow
            root={root}
            row={row}
            instance={instance}
            key={row.id}
            contextMenuDisabled={contextMenuDisabled}
            projectHasCheckpoints={projectHasCheckpoints}
            hasRunningExperiment={hasRunningExperiment}
            batchRowSelection={batchRowSelection}
          />
        ))}
    </div>
  )
}

export const TableBody: React.FC<
  RowProp & InstanceProp & WithChanges & BatchSelectionProp & WithTableRoot
> = ({
  row,
  instance,
  changes,
  contextMenuDisabled,
  projectHasCheckpoints,
  hasRunningExperiment,
  batchRowSelection,
  root
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
        root={root}
        row={row}
        projectHasCheckpoints={projectHasCheckpoints}
        hasRunningExperiment={hasRunningExperiment}
        changes={changes}
        contextMenuDisabled={contextMenuDisabled}
        batchRowSelection={batchRowSelection}
      />
      {row.isExpanded &&
        row.subRows.map(subRow => (
          <ExperimentGroup
            root={root}
            row={subRow}
            instance={instance}
            key={subRow.values.id}
            contextMenuDisabled={contextMenuDisabled}
            projectHasCheckpoints={projectHasCheckpoints}
            hasRunningExperiment={hasRunningExperiment}
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

  const { clearSelectedRows, batchSelection, lastSelectedRow } =
    React.useContext(RowSelectionContext)

  const tableRef = useRef<HTMLDivElement>(null)

  const clickOutsideHandler = React.useCallback(() => {
    clearSelectedRows?.()
  }, [clearSelectedRows])

  useClickOutside(tableRef, clickOutsideHandler)

  const batchRowSelection = React.useCallback(
    ({ row: { id } }: RowProp) => {
      const lastSelectedRowId = lastSelectedRow?.row.id ?? ''
      const lastIndex =
        flatRows.findIndex(flatRow => flatRow.id === lastSelectedRowId) || 1
      const selectedIndex =
        flatRows.findIndex(flatRow => flatRow.id === id) || 1
      const rangeStart = Math.min(lastIndex, selectedIndex)
      const rangeEnd = Math.max(lastIndex, selectedIndex)

      const collapsedIds = flatRows
        .filter(flatRow => !flatRow.isExpanded)
        .map(flatRow => flatRow.id)

      const batch = flatRows
        .slice(rangeStart, rangeEnd + 1)
        .filter(
          flatRow =>
            !collapsedIds.some(collapsedId =>
              flatRow.id.startsWith(`${collapsedId}.`)
            )
        )
        .map(row => ({ row }))

      batchSelection?.(batch)
    },
    [flatRows, batchSelection, lastSelectedRow]
  )

  return (
    <div className={styles.tableContainer}>
      <div
        {...getTableProps({ className: styles.table })}
        ref={tableRef}
        tabIndex={0}
        role="tree"
        onKeyUp={e => {
          if (e.key === 'Escape') {
            clearSelectedRows?.()
          }
        }}
      >
        <TableHead
          instance={instance}
          sorts={sorts}
          filteredCounts={filteredCounts}
          filters={filters}
          columns={columns}
          root={tableRef.current}
        />
        {rows.map(row => (
          <TableBody
            row={row}
            instance={instance}
            key={row.id}
            changes={changes}
            hasRunningExperiment={hasRunningExperiment}
            projectHasCheckpoints={hasCheckpoints}
            batchRowSelection={batchRowSelection}
            root={tableRef.current}
          />
        ))}
      </div>
    </div>
  )
}
