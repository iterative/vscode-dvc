import { PlotsComparisonData } from 'dvc/src/plots/webview/contract'
import React, { useState } from 'react'
import { ComparisonTableHeader } from './ComparisonTableHeader'
import { ComparisonTableRow } from './ComparisonTableRow'
import styles from '../styles.module.scss'
import { withScale } from '../../../util/styles'

export type ComparisonTableProps = Omit<
  PlotsComparisonData,
  'sectionName' | 'size'
>

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  plots,
  revisions
}) => {
  const [pinnedColumn, setPinnedColumn] = useState('')
  const columns = [
    pinnedColumn,
    ...Object.keys(revisions).filter(exp => exp !== pinnedColumn)
  ].filter(Boolean)
  const headers = columns.map(exp => {
    return (
      <th key={exp}>
        <ComparisonTableHeader
          isPinned={pinnedColumn === exp}
          onClicked={() => setPinnedColumn(exp)}
          color={revisions[exp].color}
        >
          {exp}
        </ComparisonTableHeader>
      </th>
    )
  })

  return (
    <table className={styles.comparisonTable} style={withScale(columns.length)}>
      <thead>
        <tr>{headers}</tr>
      </thead>
      {plots.map(({ path, revisions }) => (
        <ComparisonTableRow
          key={path}
          path={path}
          plots={columns.map(column => revisions[column])}
          nbColumns={columns.length}
        />
      ))}
    </table>
  )
}
