import React, { RefObject, useCallback, useContext } from 'react'
import { useSelector } from 'react-redux'
import { TableBody } from './TableBody'
import { RowSelectionContext } from '../RowSelectionContext'
import { ExperimentsState } from '../../../store'
import { InstanceProp, RowProp } from '../../../util/interfaces'

interface TableContentProps extends InstanceProp {
  tableRef: RefObject<HTMLTableElement>
  tableHeadHeight: number
}

export const TableContent: React.FC<TableContentProps> = ({
  instance,
  tableRef,
  tableHeadHeight
}) => {
  const { rows, flatRows } = instance.getRowModel()
  const { batchSelection, lastSelectedRow } = useContext(RowSelectionContext)
  const hasCheckpoints = useSelector(
    (state: ExperimentsState) => state.tableData.hasCheckpoints
  )
  const hasRunningExperiment = useSelector(
    (state: ExperimentsState) => state.tableData.hasRunningExperiment
  )
  const batchRowSelection = useCallback(
    ({ row: { id } }: RowProp) => {
      const lastSelectedRowId = lastSelectedRow?.row.id ?? ''
      const lastIndex =
        flatRows.findIndex(flatRow => flatRow.id === lastSelectedRowId) || 1
      const selectedIndex =
        flatRows.findIndex(flatRow => flatRow.id === id) || 1
      const rangeStart = Math.min(lastIndex, selectedIndex)
      const rangeEnd = Math.max(lastIndex, selectedIndex)

      const collapsedIds = flatRows
        .filter(flatRow => !flatRow.getIsExpanded())
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
    <>
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
    </>
  )
}
