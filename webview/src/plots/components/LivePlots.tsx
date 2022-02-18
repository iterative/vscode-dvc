import { LivePlotData, LivePlotsColors } from 'dvc/src/plots/webview/contract'
import React from 'react'
import { EmptyState } from './EmptyState'
import { Plot } from './Plot'
import styles from './styles.module.scss'

interface LivePlotsProps {
  plots: LivePlotData[]
  colors: LivePlotsColors
}

export const LivePlots: React.FC<LivePlotsProps> = ({ plots, colors }) =>
  plots.length ? (
    <div className={styles.singleViewPlotsGrid}>
      {plots.map(plotData => (
        <Plot
          values={plotData.values}
          title={plotData.title}
          scale={colors}
          key={`plot-${plotData.title}`}
        />
      ))}
    </div>
  ) : (
    EmptyState('No metrics selected')
  )
