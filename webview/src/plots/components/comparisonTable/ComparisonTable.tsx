import { ComparisonPlots, Revision } from 'dvc/src/plots/webview/contract'
import { reorderObjectList } from 'dvc/src/util/array'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { ComparisonTableRow } from './ComparisonTableRow'
import {
  ComparisonTableColumn,
  ComparisonTableHead
} from './ComparisonTableHead'
import { RowDropTarget } from './RowDropTarget'
import plotsStyles from '../styles.module.scss'
import { withScale } from '../../../util/styles'
import { sendMessage } from '../../../shared/vscode'
import { PlotsState } from '../../store'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { DragDropContainer } from '../../../shared/components/dragDrop/DragDropContainer'

export const ComparisonTable: React.FC = () => {
  const { plots } = useSelector((state: PlotsState) => state.comparison)

  const { selectedRevisions: revisions } = useSelector(
    (state: PlotsState) => state.webview
  )

  const pinnedColumn = useRef('')
  const [columns, setColumns] = useState<ComparisonTableColumn[]>([])
  const [comparisonPlots, setComparisonPlots] = useState<ComparisonPlots>([])
  const [rowsOrder, setRowsOrder] = useState<string[]>([])

  const isPinned = (column: ComparisonTableColumn): boolean =>
    column.revision === pinnedColumn.current

  const getPinnedColumnRevision = useCallback(
    () => revisions?.find(isPinned) || null,
    [revisions]
  )

  useEffect(
    // eslint-disable-next-line sonarjs/cognitive-complexity
    () =>
      setColumns(() => {
        const acc: Revision[] = []

        for (const column of revisions || []) {
          if (isPinned(column)) {
            continue
          }
          acc.push(column)
        }

        return [getPinnedColumnRevision(), ...acc].filter(
          Boolean
        ) as ComparisonTableColumn[]
      }),
    [revisions, getPinnedColumnRevision]
  )

  useEffect(() => {
    setComparisonPlots(plots)
    setRowsOrder(plots.map(({ path }) => path))
  }, [plots])

  if (!plots || plots.length === 0) {
    return <EmptyState isFullScreen={false}>No Images to Compare</EmptyState>
  }

  const setColumnsOrder = (order: string[]) => {
    const newOrder = reorderObjectList<Revision>(order, columns, 'revision')
    setColumns(newOrder)
    sendMessage({
      payload: newOrder.map(({ revision }) => revision),
      type: MessageFromWebviewType.REORDER_PLOTS_COMPARISON
    })
  }

  const changePinnedColumn = (column: string) => {
    pinnedColumn.current = pinnedColumn.current === column ? '' : column

    setColumnsOrder(
      (
        [
          getPinnedColumnRevision(),
          ...columns.filter(column => !isPinned(column))
        ].filter(Boolean) as ComparisonTableColumn[]
      ).map(({ revision }) => revision)
    )
  }

  const rows = rowsOrder.map(path => {
    const plot = comparisonPlots.find(p => p.path === path)
    if (!plot) {
      return
    }
    const revs = plot.revisions
    return (
      <tbody key={path} id={path}>
        <ComparisonTableRow
          path={path}
          plots={columns.map(column => ({
            ...revs[column.revision],
            revision: column.revision
          }))}
          nbColumns={columns.length}
          pinnedColumn={pinnedColumn.current}
        />
      </tbody>
    )
  })

  return (
    <table
      className={plotsStyles.comparisonTable}
      style={withScale(columns.length)}
    >
      <ComparisonTableHead
        columns={columns}
        pinnedColumn={pinnedColumn.current}
        setColumnsOrder={setColumnsOrder}
        setPinnedColumn={changePinnedColumn}
      />
      <DragDropContainer
        items={rows as JSX.Element[]}
        order={rowsOrder}
        setOrder={setRowsOrder}
        group="comparison-table"
        dropTarget={<RowDropTarget colSpan={columns.length} />}
      />
    </table>
  )
}
