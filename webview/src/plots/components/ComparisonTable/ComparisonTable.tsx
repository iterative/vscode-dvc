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
    columns.filter(exp => exp.revision !== pinnedColumn.current)

  const getPinnedColumnRevision = useCallback(
    () =>
      (!!pinnedColumn.current && {
        color: revisions[pinnedColumn.current].color,
        revision: pinnedColumn.current
      }) ||
      null,
    [revisions]
  )

  useEffect(() => {
    const revisionKeys = Object.keys(revisions)

    setColumns(prevColumns => {
      const columnKeys = prevColumns.map(col => col.revision)
      const filteredColumns = prevColumns.filter(col =>
        revisionKeys.includes(col.revision)
      )
      const newColKeys = revisionKeys.filter(rev => !columnKeys.includes(rev))
      const newCols = newColKeys.map(key => ({
        color: revisions[key].color,
        revision: key
      }))

      return [
        getPinnedColumnRevision(),
        ...withoutPinned([...filteredColumns, ...newCols])
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
      {plots.map(({ path, revisions }) => (
        <ComparisonTableRow
          key={path}
          path={path}
          plots={columns.map(column => revisions[column.revision])}
          nbColumns={columns.length}
          pinnedColumn={pinnedColumn.current}
        />
      ))}
    </table>
  )
}
