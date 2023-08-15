import React, { Fragment, RefObject, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { TableBody } from './TableBody'
import { collectBranchWithRows } from './util'
import { BranchDivider } from './branchDivider/BranchDivider'
import { InstanceProp } from '../../../util/interfaces'
import { updateRowOrder } from '../../../state/rowSelectionSlice'

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
      {collectBranchWithRows(rows).map(([branch, branchRows]) => {
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
