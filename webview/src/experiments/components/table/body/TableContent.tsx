import React, { Fragment, RefObject, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useVirtual } from '@tanstack/react-virtual'
import { TableBody } from './TableBody'
import { collectBranchWithRows } from './util'
import { BranchDivider } from './branchDivider/BranchDivider'
import { InstanceProp } from '../../../util/interfaces'
import { updateRowOrder } from '../../../state/rowSelectionSlice'
import { OVERSCAN_ROW_COUNT } from '../../../../shared/components/virtualizedGrid/VirtualizedGrid'

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
  const dispatch = useDispatch()

  const rowVirtualizer = useVirtual({
    overscan: OVERSCAN_ROW_COUNT,
    parentRef: tableRef,
    size: rows.length
  })
  const { virtualItems: virtualRows } = rowVirtualizer

  useEffect(() => {
    dispatch(
      updateRowOrder(
        flatRows.map(
          ({ depth, original: { branch, id, executorStatus, starred } }) => ({
            branch,
            depth,
            executorStatus,
            id,
            starred
          })
        )
      )
    )
  }, [dispatch, flatRows])

  return (
    <>
      {collectBranchWithRows(virtualRows, rows).map(([branch, branchRows]) => {
        return (
          <Fragment key={branch}>
            {branchRows.map((row, i) => {
              const isFirstBranchRow = branch && i === 0
              return (
                <Fragment key={row.id}>
                  {isFirstBranchRow && (
                    <BranchDivider branch={branch}>{branch}</BranchDivider>
                  )}
                  <TableBody
                    tableHeaderHeight={tableHeadHeight}
                    root={tableRef.current}
                    row={row}
                    instance={instance}
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
