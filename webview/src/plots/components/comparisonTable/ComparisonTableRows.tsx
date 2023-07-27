import { ComparisonPlots } from 'dvc/src/plots/webview/contract'
import React, { createRef, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ComparisonTableColumn } from './ComparisonTableHead'
import { ComparisonTableRow } from './ComparisonTableRow'
import { changeRowHeight, DEFAULT_ROW_HEIGHT } from './comparisonTableSlice'
import { RowDropTarget } from './RowDropTarget'
import { DragDropContainer } from '../../../shared/components/dragDrop/DragDropContainer'
import { reorderComparisonRows } from '../../util/messages'
import { PlotsState } from '../../store'

interface ComparisonTableRowsProps {
  plots: ComparisonPlots
  columns: ComparisonTableColumn[]
  pinnedColumn: string
}

export const ComparisionTableRows: React.FC<ComparisonTableRowsProps> = ({
  plots,
  columns,
  pinnedColumn
}) => {
  const [rowsOrder, setRowsOrder] = useState<string[]>([])
  const dispatch = useDispatch()
  const firstRowRef = createRef<HTMLTableSectionElement>()
  const disabledDragPlotIds = useSelector(
    (state: PlotsState) => state.comparison.disabledDragPlotIds
  )

  useEffect(() => {
    setRowsOrder(plots.map(({ path }) => path))
  }, [plots])

  const onLayoutChange = () => {
    const firstRowHeight =
      firstRowRef.current?.getBoundingClientRect().height || DEFAULT_ROW_HEIGHT
    dispatch(changeRowHeight(firstRowHeight))
  }

  const rows = rowsOrder.map((path, i) => {
    const plot = plots.find(p => p.path === path)
    if (!plot) {
      return
    }
    const revs = plot.revisions
    return (
      <tbody key={path} id={path} ref={i === 0 ? firstRowRef : undefined}>
        <ComparisonTableRow
          path={path}
          plots={columns.map(column => ({
            ...revs[column.id],
            id: column.id
          }))}
          nbColumns={columns.length}
          pinnedColumn={pinnedColumn}
        />
      </tbody>
    )
  })

  const changeRowsOrder = (order: string[]) => {
    setRowsOrder(order)
    reorderComparisonRows(order)
  }

  return (
    <DragDropContainer
      items={rows as JSX.Element[]}
      order={rowsOrder}
      setOrder={changeRowsOrder}
      group="comparison-table"
      dropTarget={<RowDropTarget colSpan={columns.length} />}
      onLayoutChange={onLayoutChange}
      disabledDropIds={disabledDragPlotIds}
      vertical
    />
  )
}
