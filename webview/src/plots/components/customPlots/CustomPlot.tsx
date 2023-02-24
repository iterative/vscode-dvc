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

interface CustomPlotProps {
  id: string
}

export const CustomPlot: React.FC<CustomPlotProps> = ({ id }) => {
  const dispatch = useDispatch()
  const plotSnapshot = useSelector(
    (state: PlotsState) => state.custom.plotsSnapshots[id]
  )
  const [plot, setPlot] = useState(plotDataStore[Section.CUSTOM_PLOTS][id])
  const currentSize = useSelector((state: PlotsState) => state.custom.size)

  const spec = useMemo(() => {
    if (plot) {
      return createSpec(plot.metric, plot.param)
    }
  }, [plot])

  useEffect(() => {
    setPlot(plotDataStore[Section.CUSTOM_PLOTS][id])
  }, [plotSnapshot, id])

  if (!plot || !spec) {
    return null
  }

  const key = `plot-${id}`

  const toggleDrag = (enabled: boolean) => {
    dispatch(changeDisabledDragIds(enabled ? [] : [id]))
  }

  return (
    <div className={styles.plot} data-testid={key} id={id} style={withScale(1)}>
      <ZoomablePlot
        spec={spec}
        id={id}
        toggleDrag={toggleDrag}
        changeSize={changeSize}
        currentSnapPoint={currentSize}
        section={Section.CUSTOM_PLOTS}
      />
    </div>
  )
}
