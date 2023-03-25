import {
  ColorScale,
  CustomPlotData,
  CustomPlotType,
  PlotsSection
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
import { GripIcon } from '../../../shared/components/dragDrop/GripIcon'

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
    return createCheckpointSpec(plot.yTitle, plot.metric, plot.param, colors)
  }
  return createMetricVsParamSpec(plot.yTitle, plot.param)
}

export const CustomPlot: React.FC<CustomPlotProps> = ({ id }) => {
  const plotSnapshot = useSelector(
    (state: PlotsState) => state.custom.plotsSnapshots[id]
  )

  const [plot, setPlot] = useState(plotDataStore[PlotsSection.CUSTOM_PLOTS][id])
  const { nbItemsPerRow, colors } = useSelector(
    (state: PlotsState) => state.custom
  )
  const spec = useMemo(() => {
    return createCustomPlotSpec(plot, colors)
  }, [plot, colors])

  useEffect(() => {
    setPlot(plotDataStore[PlotsSection.CUSTOM_PLOTS][id])
  }, [plotSnapshot, id])

  if (!plot) {
    return null
  }

  const key = `plot-${id}`

  return (
    <div className={styles.plot} data-testid={key} id={id} style={withScale(1)}>
      {plot.type === CustomPlotType.CHECKPOINT && plot.values.length === 0 ? (
        <div className={styles.noCustomPlotContent}>
          <GripIcon className={styles.plotGripIcon} />
          There are no selected experiments.
        </div>
      ) : (
        <ZoomablePlot
          spec={spec}
          id={id}
          changeDisabledDragIds={changeDisabledDragIds}
          currentSnapPoint={nbItemsPerRow}
          section={PlotsSection.CUSTOM_PLOTS}
        />
      )}
    </div>
  )
}
