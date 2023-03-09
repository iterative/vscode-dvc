import { AnyAction } from '@reduxjs/toolkit'
import { Section } from 'dvc/src/plots/webview/contract'
import React, { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { VisualizationSpec } from 'react-vega'
import VegaLite, { VegaLiteProps } from 'react-vega/lib/VegaLite'
import { setZoomedInPlot } from './webviewSlice'
import styles from './styles.module.scss'
import { config } from './constants'
import { zoomPlot } from './messages'
import { useGetPlot } from '../hooks/useGetPlot'
import { GripIcon } from '../../shared/components/dragDrop/GripIcon'

interface ZoomablePlotProps {
  spec?: VisualizationSpec
  id: string
  onViewReady?: () => void
  changeDisabledDragIds: (ids: string[]) => AnyAction
  changeSize: (nbItemsPerRow: number) => AnyAction
  currentSnapPoint: number
  section: Section
  shouldNotResize?: boolean
}

export const ZoomablePlot: React.FC<ZoomablePlotProps> = ({
  spec: createdSpec,
  id,
  onViewReady,
  section
}) => {
  const { data, content: spec } = useGetPlot(section, id, createdSpec)
  const dispatch = useDispatch()
  const currentPlotProps = useRef<VegaLiteProps>()

  const plotProps: VegaLiteProps = {
    actions: false,
    config,
    data,
    'data-testid': `${id}-vega`,
    renderer: 'svg',
    spec
  } as VegaLiteProps
  currentPlotProps.current = plotProps

  useEffect(() => {
    dispatch(
      setZoomedInPlot({ id, plot: currentPlotProps.current, refresh: true })
    )
  }, [data, spec, dispatch, id])

  const handleOnClick = () => {
    zoomPlot()
    return dispatch(setZoomedInPlot({ id, plot: plotProps }))
  }

  if (!data && !spec) {
    return null
  }
  return (
    <button className={styles.zoomablePlot} onClick={handleOnClick}>
      <GripIcon className={styles.plotGripIcon} />
      {currentPlotProps.current && (
        <VegaLite {...plotProps} onNewView={onViewReady} />
      )}
    </button>
  )
}
