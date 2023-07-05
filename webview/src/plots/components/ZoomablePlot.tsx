import { AnyAction } from '@reduxjs/toolkit'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
import React, { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { VisualizationSpec } from 'react-vega'
import VegaLite, { VegaLiteProps } from 'react-vega/lib/VegaLite'
import { setZoomedInPlot } from './webviewSlice'
import { setSmoothPlotValue } from './templatePlots/templatePlotsSlice'
import styles from './styles.module.scss'
import { config } from './constants'
import { zoomPlot } from '../util/messages'
import { useGetPlot } from '../hooks/useGetPlot'
import { GripIcon } from '../../shared/components/dragDrop/GripIcon'

interface ZoomablePlotProps {
  spec?: VisualizationSpec
  id: string
  onViewReady?: () => void
  changeDisabledDragIds: (ids: string[]) => AnyAction
  currentSnapPoint: number
  section: PlotsSection
  shouldNotResize?: boolean
}

export const ZoomablePlot: React.FC<ZoomablePlotProps> = ({
  spec: createdSpec,
  id,
  onViewReady,
  section
}) => {
  const {
    data,
    content: spec,
    smoothValue
  } = useGetPlot(section, id, createdSpec)
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
        <VegaLite
          {...plotProps}
          onNewView={view => {
            if (smoothValue) {
              const state = view.getState()
              view.setState({
                ...state,
                signals: { ...state.signals, smooth: smoothValue }
              })
            }
            if (onViewReady) {
              onViewReady()
            }
          }}
          signalListeners={
            // TBD need to have a better way to check if plot is smooth
            (spec?.params || []).find(({ name }) => name === 'smooth') && {
              smooth: (_, value) =>
                // this is going to get called a lot. Is there a way to update it when the
                // user lets go of the input?
                dispatch(setSmoothPlotValue({ id, value: value as number }))
            }
          }
        />
      )}
    </button>
  )
}
