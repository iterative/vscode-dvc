import { ColorScale } from 'dvc/src/plots/webview/contract'
import React, { useMemo, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { createSpec } from './util'
import { ZoomablePlot } from '../ZoomablePlot'
import styles from '../styles.module.scss'
import { withScale } from '../../../util/styles'
import { plotDataStore } from '../plotDataStore'
import { RootState } from '../../store'

interface CheckpointPlotProps {
  id: string
  colors: ColorScale
}

export const CheckpointPlot: React.FC<CheckpointPlotProps> = ({
  id,
  colors
}) => {
  const plotSnapshot = useSelector(
    (state: RootState) => state.checkpoint.plotsSnapshots[id]
  )
  const [plot, setPlot] = useState(plotDataStore.checkpoint[id])
  const spec = useMemo(() => (id && createSpec(id, colors)) || {}, [id, colors])

  useEffect(() => {
    setPlot(plotDataStore.checkpoint[id])
  }, [plotSnapshot, id])

  if (!plot) {
    return null
  }

  const { title, values } = plot

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
