import {
  ComparisonRevision,
  PlotsComparisonData
} from 'dvc/src/plots/webview/contract'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ComparisonTableRow } from './ComparisonTableRow'
import {
  ComparisonTableColumn,
  ComparisonTableHead
} from './ComparisonTableHead'
import plotsStyles from '../styles.module.scss'
import { withScale } from '../../../util/styles'

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

  const changePinnedColumn = (column: string) => {
    pinnedColumn.current = pinnedColumn.current === column ? '' : column

    setColumns(
      [
        getPinnedColumnRevision(),
        ...columns.filter(column => !isPinned(column))
      ].filter(Boolean) as ComparisonTableColumn[]
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
        setColumnsOrder={setColumns}
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
