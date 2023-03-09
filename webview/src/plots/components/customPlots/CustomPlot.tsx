import {
  CheckpointPlotData,
  ColorScale,
  CustomPlotData,
  CustomPlotType,
  Section
} from 'dvc/src/plots/webview/contract'
import React, { useMemo, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { createMetricVsParamSpec, createCheckpointSpec } from './util'
import { changeDisabledDragIds, changeSize } from './customPlotsSlice'
import { ZoomablePlot } from '../ZoomablePlot'
import styles from '../styles.module.scss'
import { withScale } from '../../../util/styles'
import { plotDataStore } from '../plotDataStore'
import { PlotsState } from '../../store'

interface CustomPlotProps {
  id: string
}

const isCheckpointPlot = (plot: CustomPlotData): plot is CheckpointPlotData => {
  return plot.type === CustomPlotType.CHECKPOINT
}

const createCustomPlotSpec = (
  plot: CustomPlotData | undefined,
  colors: ColorScale | undefined
) => {
  if (!plot) {
    return {}
  }

  if (isCheckpointPlot(plot)) {
    return colors ? createCheckpointSpec(plot.yTitle, colors) : {}
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
        changeSize={changeSize}
        changeDisabledDragIds={changeDisabledDragIds}
        currentSnapPoint={nbItemsPerRow}
        section={Section.CUSTOM_PLOTS}
      />
    </div>
  )
}
