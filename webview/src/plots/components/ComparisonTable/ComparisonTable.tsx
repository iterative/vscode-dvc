import {
  LivePlotsColors,
  PlotsOutput,
  StaticPlot
} from 'dvc/src/plots/webview/contract'
import React, { useState } from 'react'
import { ComparisonTableHeader } from './ComparisonTableHeader'
import { StaticPlotComponent } from '../StaticPlot'

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

  const revisions: string[] = []
  const entries = Object.entries(plots)

  if (entries.length) {
    entries[0][1].forEach(p => p.revisions && revisions.push(...p.revisions))
  }

  return (
    <table>
      <thead>
        <tr>{headers}</tr>
      </thead>
      <tbody>
        {entries.map(([path, plots]) => (
          <tr key={path}>
            {plots.map((plot: StaticPlot) => (
              <td
                key={path + plot.revisions?.[0]}
                data-something={plot.revisions}
              >
                <StaticPlotComponent plot={plot} path={path} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
