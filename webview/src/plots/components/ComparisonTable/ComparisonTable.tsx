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

type ColumnAccumulator = {
  filteredColumns: ComparisonRevision[]
  newColumns: ComparisonRevision[]
}

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

  const retainOrder = (
    originalOrder: string[],
    revisions: ComparisonTableColumn[]
  ) =>
    revisions.sort(
      ({ revision: a }, { revision: b }) =>
        originalOrder.indexOf(a) - originalOrder.indexOf(b)
    )

  const splitColumns = (
    acc: ColumnAccumulator,
    column: ComparisonRevision,
    prevColumnKeys: string[]
  ) => {
    prevColumnKeys.includes(column.revision)
      ? acc.filteredColumns.push(column)
      : acc.newColumns.push(column)

    return acc
  }

  useEffect(
    () =>
      setColumns(prevColumns => {
        const prevColumnKeys = prevColumns.map(col => col.revision)
        const { filteredColumns, newColumns } = revisions.reduce(
          (acc, column) => {
            if (isPinned(column)) {
              return acc
            }

            return splitColumns(acc, column, prevColumnKeys)
          },
          {
            filteredColumns: [],
            newColumns: []
          } as ColumnAccumulator
        )

        return [
          getPinnedColumnRevision(),
          ...retainOrder(prevColumnKeys, filteredColumns),
          ...newColumns
        ].filter(Boolean) as ComparisonTableColumn[]
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
