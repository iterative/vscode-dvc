import { LivePlotsColors, LivePlotValues } from 'dvc/src/plots/webview/contract'
import React from 'react'
import { VegaLite } from 'react-vega'
import { config, createSpec } from './constants'
import styles from './styles.module.scss'
import { withScale } from '../../util/styles'

interface PlotProps {
  values: LivePlotValues
  title: string
  scale?: LivePlotsColors
}

export const Plot: React.FC<PlotProps> = ({ values, title, scale }) => {
  const spec = createSpec(title, scale)

  return (
    <div
      className={styles.plot}
      style={withScale(1)}
      data-testid={`plot-${title}`}
    >
      <VegaLite
        actions={false}
        config={config}
        spec={spec}
        data={{ values }}
        renderer="svg"
      />
    </div>
  )
}
