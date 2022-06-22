import { CheckpointPlotData, ColorScale } from 'dvc/src/plots/webview/contract'
import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { createSpec } from './util'
import { getCheckpointPlot } from './checkpointPlotsSlice'
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
  const { title, values } = useSelector((state: RootState) =>
    (getCheckpointPlot as (state: RootState, id: string) => CheckpointPlotData)(
      state,
      id
    )
  )
  const spec = useMemo(
    () => (title && createSpec(title, colors)) || {},
    [title, colors]
  )

  if (!title) {
    return null
  }

  const key = `plot-${title}`

  return (
    <div
      className={styles.plot}
      data-testid={key}
      id={title}
      style={withScale(1)}
    >
      <ZoomablePlot spec={spec} data={{ values }} id={key} />
    </div>
  )
}
