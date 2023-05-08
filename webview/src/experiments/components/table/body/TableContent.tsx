import React, { Fragment, RefObject, useCallback, useContext } from 'react'
import { useSelector } from 'react-redux'
import { TableBody } from './TableBody'
import { BranchDivider } from './branchDivider/BranchDivider'
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
  const { branches } = useSelector((state: ExperimentsState) => state.tableData)

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
      {branches.map((branch, branchIndex) => {
        const branchRows = rows.filter(row => row.original.branch === branch)

        return (
          <Fragment key={branch}>
            {branchRows.map((row, i) => {
              const isFirstRow =
                (branchIndex === 0 && i === 1) || (branchIndex !== 0 && i === 0)
              return (
                <Fragment key={row.id}>
                  {isFirstRow && <BranchDivider>{branch}</BranchDivider>}
                  <TableBody
                    tableHeaderHeight={tableHeadHeight}
                    root={tableRef.current}
                    row={row}
                    instance={instance}
                    batchRowSelection={batchRowSelection}
                    isLast={i === branchRows.length - 1}
                  />
                </Fragment>
              )
            })}
          </Fragment>
        )
      })}
    </>
  )
}
