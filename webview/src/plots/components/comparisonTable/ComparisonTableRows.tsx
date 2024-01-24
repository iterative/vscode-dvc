import { ComparisonPlots } from 'dvc/src/plots/webview/contract'
import React, { createRef, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { ComparisonTableColumn } from './ComparisonTableHead'
import { ComparisonTableRow } from './ComparisonTableRow'
import { changeRowHeight, DEFAULT_ROW_HEIGHT } from './comparisonTableSlice'
import { reorderComparisonRows } from '../../util/messages'

interface ComparisonTableRowsProps {
  plots: ComparisonPlots
  columns: ComparisonTableColumn[]
  pinnedColumn: string
}

export const ComparisonTableRows: React.FC<ComparisonTableRowsProps> = ({
  plots,
  columns,
  pinnedColumn
}) => {
  const [rowsOrder, setRowsOrder] = useState<string[]>([])
  const dispatch = useDispatch()
  const firstRowRef = createRef<HTMLTableSectionElement>()

  useEffect(() => {
    setRowsOrder(plots.map(({ path }) => path))
  }, [plots])

  const onLayoutChange = () => {
    const firstRowHeight =
      firstRowRef.current?.getBoundingClientRect().height || DEFAULT_ROW_HEIGHT
    dispatch(changeRowHeight(firstRowHeight))
  }

  const changeRowsOrder = (order: string[]) => {
    setRowsOrder(order)
    reorderComparisonRows(order)
  }

  const rows = rowsOrder.map((path, i) => {
    const plot = plots.find(p => p.path === path)
    if (!plot) {
      return
    }
    const revs = plot.revisions
    return (
      <ComparisonTableRow
        key={path}
        path={path}
        plots={columns.map(column => ({
          id: column.id,
          imgs: revs[column.id]?.imgs
        }))}
        boundingBoxClasses={plot.boundingBoxClasses}
        nbColumns={columns.length}
        pinnedColumn={pinnedColumn}
        onLayoutChange={onLayoutChange}
        setOrder={changeRowsOrder}
        order={rowsOrder}
        bodyRef={i === 0 ? firstRowRef : undefined}
      />
    )
  })

  return <>{rows}</>
}
