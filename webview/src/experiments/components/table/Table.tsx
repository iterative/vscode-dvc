import React, { CSSProperties, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import cx from 'classnames'
import { useInView } from 'react-intersection-observer'
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

const WorkspaceRowGroupWrapper: React.FC<
  {
    children: React.ReactNode
    root: HTMLElement | null
    tableHeaderHeight: number
  } & InstanceProp
> = ({ children, instance, root, tableHeaderHeight }) => {
  const [ref, needsShadow] = useInView({
    root,
    rootMargin: `-${tableHeaderHeight + 15}px 0px 0px 0px`,
    threshold: 1
  })

  return (
    <div
      style={
        { '--table-head-height': `${tableHeaderHeight}px` } as CSSProperties
      }
      ref={ref}
      {...instance.getTableBodyProps({
        className: cx(
          styles.rowGroup,
          styles.tbody,
          styles.workspaceRowGroup,
          needsShadow && styles.withShadow
        )
      })}
    >
      {children}
    </div>
  )
}

export const TableBody: React.FC<
  RowProp &
    InstanceProp &
    BatchSelectionProp & { root: HTMLElement | null; tableHeaderHeight: number }
> = ({
  row,
  instance,
  contextMenuDisabled,
  projectHasCheckpoints,
  hasRunningExperiment,
  batchRowSelection,
  root,
  tableHeaderHeight
}) => {
  instance.prepareRow(row)

  const content = (
    <>
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
    </>
  )
  return row.values.id === 'workspace' ? (
    <WorkspaceRowGroupWrapper
      tableHeaderHeight={tableHeaderHeight}
      root={root}
      instance={instance}
    >
      {content}
    </WorkspaceRowGroupWrapper>
  ) : (
    <div
      {...instance.getTableBodyProps({
        className: cx(styles.rowGroup, styles.tbody, styles.normalRowGroup)
      })}
    >
      {content}
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
  const [tableHeadHeight, setTableHeadHeight] = useState(55)

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
          setTableHeadHeight={setTableHeadHeight}
        />
        {rows.map(row => (
          <TableBody
            tableHeaderHeight={tableHeadHeight}
            root={tableRef.current}
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
