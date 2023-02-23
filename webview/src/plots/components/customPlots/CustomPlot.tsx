import { Section } from 'dvc/src/plots/webview/contract'
import React, { useMemo, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { createSpec } from './util'
import { changeDisabledDragIds, changeSize } from './customPlotsSlice'
import { ZoomablePlot } from '../ZoomablePlot'
import styles from '../styles.module.scss'
import { withScale } from '../../../util/styles'
import { plotDataStore } from '../plotDataStore'
import { PlotsState } from '../../store'
import { useResize } from '../../hooks/useResize'

interface CustomPlotProps {
  id: string
}

export const CustomPlot: React.FC<CustomPlotProps> = ({ id }) => {
  const dispatch = useDispatch()
  const plotSnapshot = useSelector(
    (state: PlotsState) => state.custom.plotsSnapshots[id]
  )
  const [plot, setPlot] = useState(plotDataStore.custom[id])
  const currentSize = useSelector((state: PlotsState) => state.custom.size)
  const { onResize: handleResize, snapPoints } = useResize(
    Section.CUSTOM_PLOTS,
    changeSize
  )

  const spec = useMemo(() => {
    return createSpec(plot.metric, plot.param)
  }, [plot.metric, plot.param])

  useEffect(() => {
    setPlot(plotDataStore.custom[id])
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
        currentSnapPoint={currentSize}
        size={snapPoints[currentSize - 1]}
      />
    </div>
  )
}
