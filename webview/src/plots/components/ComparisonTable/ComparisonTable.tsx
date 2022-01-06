import {
  LivePlotsColors,
  PlotsOutput,
  StaticPlot
} from 'dvc/src/plots/webview/contract'
import React, { useState } from 'react'
import { ComparisonTableHeader } from './ComparisonTableHeader'
import { ComparisonTableRow } from './ComparisonTableRow'

export interface ComparisonTableProps {
  plots: PlotsOutput
  colors: LivePlotsColors
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  plots,
  colors
}) => {
  const [pinnedColumn, setPinnedColumn] = useState('')
  const columns = [
    pinnedColumn,
    ...colors.domain.filter(domain => domain !== pinnedColumn)
  ].filter(Boolean)
  const headers = columns.map(exp => {
    const colorIndex = colors.domain.indexOf(exp)

    return (
      <th key={exp}>
        <ComparisonTableHeader
          isPinned={pinnedColumn === exp}
          onClicked={() => setPinnedColumn(exp)}
          color={colors.range[colorIndex]}
        >
          {exp}
        </ComparisonTableHeader>
      </th>
    )
  })

  return (
    <table>
      <thead>
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
        />
      ))}
    </table>
  )
}
