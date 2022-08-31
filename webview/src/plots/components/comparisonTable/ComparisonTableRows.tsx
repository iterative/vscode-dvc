import { ComparisonPlots } from 'dvc/src/plots/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import React, { createRef, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { ComparisonTableColumn } from './ComparisonTableHead'
import { ComparisonTableRow } from './ComparisonTableRow'
import { changeRowHeight, DEFAULT_ROW_HEIGHT } from './comparisonTableSlice'
import { RowDropTarget } from './RowDropTarget'
import { DragDropContainer } from '../../../shared/components/dragDrop/DragDropContainer'
import { sendMessage } from '../../../shared/vscode'

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
            ...revs[column.revision],
            revision: column.revision
          }))}
          nbColumns={columns.length}
          pinnedColumn={pinnedColumn}
        />
      </tbody>
    )
  })

  const changeRowsOrder = (order: string[]) => {
    setRowsOrder(order)
    sendMessage({
      payload: order,
      type: MessageFromWebviewType.REORDER_PLOTS_COMPARISON_ROWS
    })
  }

  return (
    <DragDropContainer
      items={rows as JSX.Element[]}
      order={rowsOrder}
      setOrder={changeRowsOrder}
      group="comparison-table"
      dropTarget={<RowDropTarget colSpan={columns.length} />}
      onLayoutChange={onLayoutChange}
      vertical
    />
  )
}
