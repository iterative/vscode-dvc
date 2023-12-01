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

export const ComparisonTableRows: React.FC<ComparisonTableRowsProps> = ({
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

  const rows = rowsOrder
    .map((path, i) => {
      const plot = plots.find(p => p.path === path)
      if (!plot) {
        return
      }
      const revs = plot.revisions
      return (
        <tbody
          data-testid="comparison-table-body"
          key={path}
          id={path}
          ref={i === 0 ? firstRowRef : undefined}
        >
          <ComparisonTableRow
            path={path}
            plots={columns.map(column => ({
              id: column.id,
              imgs: revs[column.id]?.imgs
            }))}
            nbColumns={columns.length}
            pinnedColumn={pinnedColumn}
          />
        </tbody>
      )
    })
    .filter(Boolean) as JSX.Element[]

  const changeRowsOrder = (order: string[]) => {
    setRowsOrder(order)
    reorderComparisonRows(order)
  }

  return (
    <DragDropContainer
      items={rows}
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
