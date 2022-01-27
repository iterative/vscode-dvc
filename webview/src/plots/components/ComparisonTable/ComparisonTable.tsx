import { PlotsComparisonData, StaticPlot } from 'dvc/src/plots/webview/contract'
import React, { useState } from 'react'
import cx from 'classnames'
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
  colors
}) => {
  const [pinnedColumn, setPinnedColumn] = useState('')
  const columns = [
    pinnedColumn,
    ...Object.keys(colors).filter(exp => exp !== pinnedColumn)
  ].filter(Boolean)
  const headers = columns.map(exp => {
    return (
      <th
        key={exp}
        className={cx({ [styles.pinnedColumn]: exp === pinnedColumn })}
      >
        <ComparisonTableHeader
          isPinned={pinnedColumn === exp}
          onClicked={() => setPinnedColumn(exp)}
          color={colors[exp]}
        >
          {exp}
        </ComparisonTableHeader>
      </th>
    )
  })

  return (
    <table className={styles.comparisonTable} style={withScale(columns.length)}>
      <thead className={styles.comparisonTableHeaders}>
        <tr>{headers}</tr>
      </thead>
      {Object.entries(plots).map(([path, plots]) => (
        <ComparisonTableRow
          key={path}
          path={path}
          plots={
            columns.map(column =>
              plots.find(plot => plot.revisions?.[0] === column)
            ) as StaticPlot[]
          }
          nbColumns={columns.length}
          pinnedColumn={pinnedColumn}
        />
      ))}
    </table>
  )
}
