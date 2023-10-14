import { ComparisonPlots, Revision } from 'dvc/src/plots/webview/contract'
import { reorderObjectList } from 'dvc/src/util/array'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import {
  ComparisonTableColumn,
  ComparisonTableHead
} from './ComparisonTableHead'
import { ComparisionTableRows } from './ComparisonTableRows'
import plotsStyles from '../styles.module.scss'
import { withScale, withVariant } from '../../../util/styles'
import { PlotsState } from '../../store'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { reorderComparisonPlots } from '../../util/messages'
import { WaitForPlotsInfo } from '../emptyState/WaitForPlotsInfo'

export const ComparisonTable: React.FC = () => {
  const { revisions, plots, width } = useSelector(
    (state: PlotsState) => state.comparison
  )

  const pinnedColumn = useRef('')
  const [columns, setColumns] = useState<ComparisonTableColumn[]>([])
  const [comparisonPlots, setComparisonPlots] = useState<ComparisonPlots>([])

  const isPinned = (column: ComparisonTableColumn): boolean =>
    column.id === pinnedColumn.current

  const getPinnedColumnRevision = useCallback(
    () => revisions?.find(isPinned) || null,
    [revisions]
  )

  useEffect(
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
  }, [plots])

  if (!plots || plots.length === 0) {
    return (
      <EmptyState isFullScreen={false}>
        No Images to Compare
        <WaitForPlotsInfo />
      </EmptyState>
    )
  }

  const setColumnsOrder = (order: string[]) => {
    const newOrder = reorderObjectList<Revision>(order, columns, 'id')
    setColumns(newOrder)
    reorderComparisonPlots(newOrder)
  }

  const changePinnedColumn = (column: string) => {
    pinnedColumn.current = pinnedColumn.current === column ? '' : column

    setColumnsOrder(
      (
        [
          getPinnedColumnRevision(),
          ...columns.filter(column => !isPinned(column))
        ].filter(Boolean) as ComparisonTableColumn[]
      ).map(({ id }) => id)
    )
  }

  return (
    <table
      className={plotsStyles.comparisonTable}
      style={{ ...withScale(columns.length), ...withVariant(width) }}
    >
      <ComparisonTableHead
        columns={columns}
        pinnedColumn={pinnedColumn.current}
        setColumnsOrder={setColumnsOrder}
        setPinnedColumn={changePinnedColumn}
      />
      <ComparisionTableRows
        plots={comparisonPlots}
        columns={columns}
        pinnedColumn={pinnedColumn.current}
      />
    </table>
  )
}
