import React, { useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import cx from 'classnames'
import styles from './styles.module.scss'
import { TableHead } from './TableHead'
import { BatchSelectionProp, RowContent } from './Row'
import { InstanceProp, RowProp } from './interfaces'
import { RowSelectionContext } from './RowSelectionContext'
import { useClickOutside } from '../../../shared/hooks/useClickOutside'
import { ExperimentsState } from '../../store'

export const NestedRow: React.FC<
  RowProp & InstanceProp & BatchSelectionProp
> = ({
  row,
  instance,
  contextMenuDisabled,
  projectHasCheckpoints,
  hasRunningExperiment,
  batchRowSelection
}) => {
  instance.prepareRow(row)
  return (
    <RowContent
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
  RowProp & InstanceProp & BatchSelectionProp
> = ({
  row,
  instance,
  contextMenuDisabled,
  projectHasCheckpoints,
  hasRunningExperiment,
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
        hasRunningExperiment={hasRunningExperiment}
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
            hasRunningExperiment={hasRunningExperiment}
            batchRowSelection={batchRowSelection}
          />
        ))}
    </div>
  )
}

export const TableBody: React.FC<
  RowProp & InstanceProp & BatchSelectionProp
> = ({
  row,
  instance,
  contextMenuDisabled,
  projectHasCheckpoints,
  hasRunningExperiment,
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
        hasRunningExperiment={hasRunningExperiment}
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
            hasRunningExperiment={hasRunningExperiment}
            batchRowSelection={batchRowSelection}
          />
        ))}
    </div>
  )
}

export const Table: React.FC<InstanceProp> = ({ instance }) => {
  const { getTableProps, rows, flatRows } = instance
  const hasCheckpoints = useSelector(
    (state: ExperimentsState) => state.tableData.hasCheckpoints
  )
  const hasRunningExperiment = useSelector(
    (state: ExperimentsState) => state.tableData.hasRunningExperiment
  )

  const { clearSelectedRows, batchSelection, lastSelectedRow } =
    React.useContext(RowSelectionContext)
  const [expColumnNeedsShadow, setExpColumnNeedsShadow] = useState(false)

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
        {...getTableProps({
          className: cx(
            styles.table,
            expColumnNeedsShadow && styles.withExpColumnShadow
          )
        })}
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
          root={tableRef.current}
          setExpColumnNeedsShadow={setExpColumnNeedsShadow}
        />
        {rows.map(row => (
          <TableBody
            row={row}
            instance={instance}
            key={row.id}
            hasRunningExperiment={hasRunningExperiment}
            projectHasCheckpoints={hasCheckpoints}
            batchRowSelection={batchRowSelection}
          />
        ))}
      </div>
    </div>
  )
}
