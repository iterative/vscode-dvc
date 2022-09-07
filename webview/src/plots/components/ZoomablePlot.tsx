import React, { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { PlainObject, VisualizationSpec } from 'react-vega'
import { Renderers } from 'vega'
import VegaLite, { VegaLiteProps } from 'react-vega/lib/VegaLite'
import { PlotSize } from 'dvc/src/plots/webview/contract'
import { setZoomedInPlot } from './webviewSlice'
import styles from './styles.module.scss'
import { config } from './constants'
import { truncateTitle } from './util'
import { GripIcon } from '../../shared/components/dragDrop/GripIcon'

interface ZoomablePlotProps {
  spec: VisualizationSpec
  data?: PlainObject
  id: string
  size: PlotSize
  onViewReady?: () => void
}

const TitleLimit = {
  [PlotSize.LARGE]: 50,
  [PlotSize.REGULAR]: 50,
  [PlotSize.SMALL]: 30
}

export const ZoomablePlot: React.FC<ZoomablePlotProps> = ({
  spec,
  data,
  id,
  size,
  onViewReady
}) => {
  const dispatch = useDispatch()
  const previousSpecsAndData = useRef(JSON.stringify({ data, spec }))
  const currentPlotProps = useRef<VegaLiteProps>()
  const newSpecsAndData = JSON.stringify({ data, spec })

  const plotProps: VegaLiteProps = {
    actions: false,
    config,
    data,
    'data-testid': `${id}-vega`,
    renderer: 'svg' as unknown as Renderers,
    spec: {
      ...spec,
      title: truncateTitle(spec.title, TitleLimit[size])
    }
  } as VegaLiteProps
  currentPlotProps.current = plotProps

  useEffect(() => {
    if (previousSpecsAndData.current !== newSpecsAndData) {
      dispatch(
        setZoomedInPlot({ id, plot: currentPlotProps.current, refresh: true })
      )
      previousSpecsAndData.current = newSpecsAndData
    }
  }, [newSpecsAndData, id, dispatch])

  const handleOnClick = () => dispatch(setZoomedInPlot({ id, plot: plotProps }))

  return (
    <button className={styles.zoomablePlot} onClick={handleOnClick}>
      <GripIcon className={styles.plotGripIcon} />
      {currentPlotProps.current && (
        <VegaLite {...plotProps} onNewView={onViewReady} />
      )}
    </button>
  )
}
