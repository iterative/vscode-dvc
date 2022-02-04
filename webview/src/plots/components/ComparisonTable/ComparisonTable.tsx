import {
  ComparisonRevisions,
  PlotsComparisonData
} from 'dvc/src/plots/webview/contract'
import React, { useState, useRef } from 'react'
import { ComparisonTableRow } from './ComparisonTableRow'
import { ComparisonTableHead } from './ComparisonTableHead'
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
  const withoutPinned = (columns: string[]): string[] =>
    columns.filter(exp => exp !== pinnedColumn.current)

  const [columns, setColumns] = useState(
    [pinnedColumn.current, ...withoutPinned(Object.keys(revisions))].filter(
      Boolean
    )
  )

  const changePinnedColumn = (column: string) => {
    pinnedColumn.current = column
    setColumns([column, ...withoutPinned(columns)])
  }

  const orderedRevision: ComparisonRevisions = {}
  columns.forEach(column => (orderedRevision[column] = revisions[column]))

  return (
    <table
      className={plotsStyles.comparisonTable}
      style={withScale(columns.length)}
    >
      <ComparisonTableHead
        columns={orderedRevision}
        pinnedColumn={pinnedColumn.current}
        setColumnsOrder={setColumns}
        setPinnedColumn={changePinnedColumn}
      />
      {plots.map(({ path, revisions }) => (
        <ComparisonTableRow
          key={path}
          path={path}
          plots={columns.map(column => revisions[column])}
          nbColumns={columns.length}
          pinnedColumn={pinnedColumn.current}
        />
      ))}
    </table>
  )
}
