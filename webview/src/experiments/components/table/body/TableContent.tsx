import React, { Fragment, RefObject } from 'react'
import { Row } from '@tanstack/react-table'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import { TableBody } from './TableBody'
import { collectBranchWithRows } from './util'
import { BranchDivider } from './branchDivider/BranchDivider'

interface TableContentProps {
  rows: Row<Experiment>[]
  tableRef: RefObject<HTMLTableElement>
  tableHeadHeight: number
}

export const TableContent: React.FC<TableContentProps> = ({
  rows,
  tableHeadHeight,
  tableRef
}) => {
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
