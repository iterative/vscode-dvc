import { PlotsSection } from 'dvc/src/plots/webview/contract'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { changeDisabledDragIds } from './customPlotsSlice'
import { ZoomablePlot } from '../ZoomablePlot'
import styles from '../styles.module.scss'
import { withScale } from '../../../util/styles'
import { plotDataStore } from '../plotDataStore'
import { PlotsState } from '../../store'

interface CustomPlotProps {
  id: string
}
export const CustomPlot: React.FC<CustomPlotProps> = ({ id }) => {
  const plotSnapshot = useSelector(
    (state: PlotsState) => state.custom.plotsSnapshots[id]
  )

  const [plot, setPlot] = useState(plotDataStore[PlotsSection.CUSTOM_PLOTS][id])
  const { nbItemsPerRow } = useSelector((state: PlotsState) => state.custom)

  useEffect(() => {
    setPlot(plotDataStore[PlotsSection.CUSTOM_PLOTS][id])
  }, [plotSnapshot, id])

  if (!plot) {
    return null
  }

  const key = `plot-${id}`

  return (
    <div className={styles.plot} data-testid={key} id={id} style={withScale(1)}>
      <ZoomablePlot
        spec={plot.spec}
        id={id}
        changeDisabledDragIds={changeDisabledDragIds}
        currentSnapPoint={nbItemsPerRow}
        section={PlotsSection.CUSTOM_PLOTS}
      />
    </div>
  )
}
