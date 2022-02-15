import { PlotsComparisonData } from 'dvc/src/plots/webview/contract'
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

  const withoutPinned = (
    columns: ComparisonTableColumn[]
  ): ComparisonTableColumn[] =>
    columns.filter(({ revision }) => revision !== pinnedColumn.current)

  const getPinnedColumnRevision = useCallback(
    () =>
      revisions.find(({ revision }) => revision === pinnedColumn.current) ||
      null,
    [revisions]
  )

  useEffect(() => {
    setColumns(prevColumns => {
      const prevColumnKeys = prevColumns.map(col => col.revision)
      const { filteredColumns, newColumns } = revisions.reduce(
        (acc, column) => {
          if (prevColumnKeys.includes(column.revision)) {
            acc.filteredColumns.push(column)
          } else {
            acc.newColumns.push(column)
          }

          return acc
        },
        {
          filteredColumns: [] as ComparisonTableColumn[],
          newColumns: [] as ComparisonTableColumn[]
        }
      )

      return [
        getPinnedColumnRevision(),
        ...withoutPinned([
          ...filteredColumns.sort(function ({ revision: a }, { revision: b }) {
            return prevColumnKeys.indexOf(a) - prevColumnKeys.indexOf(b)
          }),
          ...newColumns
        ])
      ].filter(Boolean) as ComparisonTableColumn[]
    })
  }, [revisions, getPinnedColumnRevision])

  const changePinnedColumn = (column: string) => {
    pinnedColumn.current = column
    setColumns(
      [getPinnedColumnRevision(), ...withoutPinned(columns)].filter(
        Boolean
      ) as ComparisonTableColumn[]
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
