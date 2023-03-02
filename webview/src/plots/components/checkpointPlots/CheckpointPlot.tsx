import { ColorScale, Section } from 'dvc/src/plots/webview/contract'
import React, { useMemo, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { createSpec } from './util'
import { changeDisabledDragIds, changeSize } from './checkpointPlotsSlice'
import { ZoomablePlot } from '../ZoomablePlot'
import styles from '../styles.module.scss'
import { withScale } from '../../../util/styles'
import { plotDataStore } from '../plotDataStore'
import { PlotsState } from '../../store'

interface CheckpointPlotProps {
  id: string
  colors: ColorScale
}

export const CheckpointPlot: React.FC<CheckpointPlotProps> = ({
  id,
  colors
}) => {
  const plotSnapshot = useSelector(
    (state: PlotsState) => state.checkpoint.plotsSnapshots[id]
  )
  const [plot, setPlot] = useState(plotDataStore[Section.CHECKPOINT_PLOTS][id])
  const { nbItemsPerRow, height } = useSelector(
    (state: PlotsState) => state.checkpoint
  )

  const spec = useMemo(() => {
    const title = plot?.title
    if (!title) {
      return {}
    }
    return createSpec(title, colors)
  }, [plot?.title, colors])

  useEffect(() => {
    setPlot(plotDataStore[Section.CHECKPOINT_PLOTS][id])
  }, [plotSnapshot, id])

  if (!plot) {
    return null
  }

  const key = `plot-${id}`

  return (
    <div className={styles.plot} data-testid={key} id={id} style={withScale(1)}>
      <ZoomablePlot
        spec={spec}
        id={id}
        changeDisabledDragIds={changeDisabledDragIds}
        changeSize={changeSize}
        currentSnapPoint={nbItemsPerRow}
        section={Section.CHECKPOINT_PLOTS}
        height={height}
      />
    </div>
  )
}
