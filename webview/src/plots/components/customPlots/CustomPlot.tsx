import {
  ColorScale,
  CustomPlotData,
  Section
} from 'dvc/src/plots/webview/contract'
import { isCheckpointPlot } from 'dvc/src/plots/model/custom'
import React, { useMemo, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { createMetricVsParamSpec, createCheckpointSpec } from './util'
import { changeDisabledDragIds } from './customPlotsSlice'
import { ZoomablePlot } from '../ZoomablePlot'
import styles from '../styles.module.scss'
import { withScale } from '../../../util/styles'
import { plotDataStore } from '../plotDataStore'
import { PlotsState } from '../../store'

interface CustomPlotProps {
  id: string
}

const createCustomPlotSpec = (
  plot: CustomPlotData | undefined,
  colors: ColorScale | undefined
) => {
  if (!plot) {
    return {}
  }

  if (isCheckpointPlot(plot)) {
    return createCheckpointSpec(plot.yTitle, plot.param, colors)
  }
  return createMetricVsParamSpec(plot.yTitle, plot.param)
}

export const CustomPlot: React.FC<CustomPlotProps> = ({ id }) => {
  const plotSnapshot = useSelector(
    (state: PlotsState) => state.custom.plotsSnapshots[id]
  )

  const [plot, setPlot] = useState(plotDataStore[Section.CUSTOM_PLOTS][id])
  const { nbItemsPerRow, colors } = useSelector(
    (state: PlotsState) => state.custom
  )
  const spec = useMemo(() => {
    return createCustomPlotSpec(plot, colors)
  }, [plot, colors])

  useEffect(() => {
    setPlot(plotDataStore[Section.CUSTOM_PLOTS][id])
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
        currentSnapPoint={nbItemsPerRow}
        section={Section.CUSTOM_PLOTS}
      />
    </div>
  )
}
