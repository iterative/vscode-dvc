import { ColorScale } from 'dvc/src/plots/webview/contract'
import React from 'react'
import { useSelector } from 'react-redux'
import { VegaLiteProps } from 'react-vega/lib/VegaLite'
import { createSpec } from './util'
import { config } from '../constants'
import { ZoomablePlot } from '../ZoomablePlot'
import styles from '../styles.module.scss'
import { withScale } from '../../../util/styles'
import { RootState } from '../../store'

interface CheckpointPlotProps {
  id: string
  colors: ColorScale
}

export const CheckpointPlot: React.FC<CheckpointPlotProps> = ({
  id,
  colors
}) => {
  const { title, values } = useSelector(
    (state: RootState) => state.checkpoint.plotsById[id]
  )
  const key = `plot-${title}`
  const spec = createSpec(title, colors)
  const plotProps = {
    actions: false,
    config,
    data: { values },
    'data-testid': `${key}-vega`,
    renderer: 'svg',
    spec
  } as VegaLiteProps

  return (
    <div
      className={styles.plot}
      data-testid={key}
      id={title}
      style={withScale(1)}
    >
      <ZoomablePlot plotProps={JSON.stringify(plotProps)} id={key} />
    </div>
  )
}
