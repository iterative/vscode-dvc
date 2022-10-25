import { ColorScale, Section } from 'dvc/src/plots/webview/contract'
import React, { useMemo, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { createSpec } from './util'
import { changeDisabledDragIds, changeSize } from './checkpointPlotsSlice'
import { ZoomablePlot } from '../ZoomablePlot'
import styles from '../styles.module.scss'
import { withScale } from '../../../util/styles'
import { plotDataStore } from '../plotDataStore'
import { PlotsState } from '../../store'
import { useResize } from '../../hooks/useResize'

interface CheckpointPlotProps {
  id: string
  colors: ColorScale
  index: number
}

export const CheckpointPlot: React.FC<CheckpointPlotProps> = ({
  id,
  colors,
  index
}) => {
  const dispatch = useDispatch()
  const plotSnapshot = useSelector(
    (state: PlotsState) => state.checkpoint.plotsSnapshots[id]
  )
  const [plot, setPlot] = useState(plotDataStore.checkpoint[id])
  const currentSize = useSelector((state: PlotsState) => state.checkpoint.size)
  const { onResize: handleResize, snapPoints } = useResize(
    Section.CHECKPOINT_PLOTS,
    changeSize
  )
  const spec = useMemo(() => {
    const title = plot?.title
    if (!title) {
      return {}
    }
    return createSpec(title, colors)
  }, [plot?.title, colors])

  useEffect(() => {
    setPlot(plotDataStore.checkpoint[id])
  }, [plotSnapshot, id])

  if (!plot) {
    return null
  }

  const { values } = plot

  const key = `plot-${id}`

  const toggleDrag = (enabled: boolean) => {
    dispatch(changeDisabledDragIds(enabled ? [] : [id]))
  }

  return (
    <div className={styles.plot} data-testid={key} id={id} style={withScale(1)}>
      <ZoomablePlot
        spec={spec}
        data={{ values }}
        id={key}
        toggleDrag={toggleDrag}
        onResize={handleResize}
        snapPoints={snapPoints}
        size={snapPoints[currentSize - 1]}
        index={index}
      />
    </div>
  )
}
