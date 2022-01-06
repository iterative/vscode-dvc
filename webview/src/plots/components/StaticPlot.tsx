import { isVegaPlot, StaticPlot } from 'dvc/src/plots/webview/contract'
import React from 'react'
import { VegaLite, VisualizationSpec } from 'react-vega'
import { config } from './constants'

interface StaticPlotProps {
  plot: StaticPlot
  path: string
}

export const StaticPlotComponent: React.FC<StaticPlotProps> = ({
  plot,
  path
}) => (
  <>
    {isVegaPlot(plot) ? (
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
    ) : (
      <img src={plot.url} alt={`Plot of ${path} (${plot.revisions?.[0]})`} />
    )}
  </>
)
