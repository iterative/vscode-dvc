import {
  CheckpointPlotColors,
  CheckpointPlotValues
} from 'dvc/src/plots/webview/contract'
import React from 'react'
import { VegaLite } from 'react-vega'
import { config, createSpec } from './constants'

interface PlotProps {
  values: CheckpointPlotValues
  title: string
  scale?: CheckpointPlotColors
}

export const Plot: React.FC<PlotProps> = ({ values, title, scale }) => {
  const spec = createSpec(title, scale)

  return (
    <VegaLite
      actions={false}
      config={config}
      spec={spec}
      data={{ values }}
      renderer="svg"
    />
  )
}
