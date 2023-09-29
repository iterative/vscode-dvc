import React, { Fragment, RefObject } from 'react'
import { Row } from '@tanstack/react-table'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import { TableBody } from './TableBody'

interface SortedTableContentProps {
  rows: Row<Experiment>[]
  tableRef: RefObject<HTMLTableElement>
  tableHeadHeight: number
}

export const SortedTableContent: React.FC<SortedTableContentProps> = ({
  rows,
  tableHeadHeight,
  tableRef
}) => {
  return (
    <>
      {rows.map((row, i) => (
        <TableBody
          key={row.id}
          tableHeaderHeight={tableHeadHeight}
          root={tableRef.current}
          row={row}
          isLast={i === rows.length - 1}
        />
      ))}
    </>
  )
}
