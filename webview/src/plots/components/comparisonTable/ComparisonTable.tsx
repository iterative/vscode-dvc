import {
  ComparisonRevision,
  PlotsComparisonData
} from 'dvc/src/plots/webview/contract'
import { reorderObjectList } from 'dvc/src/util/array'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { ComparisonTableRow } from './ComparisonTableRow'
import {
  ComparisonTableColumn,
  ComparisonTableHead
} from './ComparisonTableHead'
import plotsStyles from '../styles.module.scss'
import { withScale } from '../../../util/styles'
import { sendMessage } from '../../../shared/vscode'

export type ComparisonTableProps = Omit<
  PlotsComparisonData,
  'sectionName' | 'size'
>

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  plots,
  revisions
}) => {
  const pinnedColumn = useRef('')
  const [columns, setColumns] = useState<ComparisonTableColumn[]>([])

  const isPinned = (column: ComparisonTableColumn): boolean =>
    column.revision === pinnedColumn.current

  const getPinnedColumnRevision = useCallback(
    () => revisions.find(isPinned) || null,
    [revisions]
  )

  useEffect(
    () =>
      setColumns(() => {
        const acc: ComparisonRevision[] = []

        for (const column of revisions) {
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

  const setColumnsOrder = (order: string[]) => {
    const newOrder = reorderObjectList<ComparisonRevision>(
      order,
      columns,
      'revision'
    )
    setColumns(newOrder)
    sendMessage({
      payload: newOrder.map(({ revision }) => revision),
      type: MessageFromWebviewType.PLOTS_COMPARISON_REORDERED
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
      {plots.map(({ path, revisions: revs }) => (
        <ComparisonTableRow
          key={path}
          path={path}
          plots={columns.map(column => revs[column.revision]).filter(Boolean)}
          nbColumns={columns.length}
          pinnedColumn={pinnedColumn.current}
        />
      ))}
    </table>
  )
}
