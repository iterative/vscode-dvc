import { VegaPlot } from 'dvc/src/plots/webview/contract'
import React from 'react'
import cx from 'classnames'
import { VegaLite, VisualizationSpec } from 'react-vega'
import { config } from './constants'
import styles from './styles.module.scss'
import { withScale } from '../../util/styles'

interface StaticPlotProps {
  plot: VegaPlot
}

export const StaticPlot: React.FC<StaticPlotProps> = ({ plot }) => {
  const nbRevisions = (plot.multiView && plot.revisions?.length) || 1
  const className = cx(styles.plot, {
    [styles.multiViewPlot]: plot.multiView
  })

  return (
    <div className={className} style={withScale(nbRevisions)}>
      <VegaLite
        actions={false}
        config={config}
        spec={
          {
            ...plot.content,
            height: 'container',
            width: 'container'
          } as VisualizationSpec
        }
        renderer="svg"
      />
    </div>
  )
}
