import { AnyAction } from '@reduxjs/toolkit'
import cx from 'classnames'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { Section } from 'dvc/src/plots/webview/contract'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { VisualizationSpec } from 'react-vega'
import { Renderers } from 'vega'
import VegaLite, { VegaLiteProps } from 'react-vega/lib/VegaLite'
import { setZoomedInPlot } from './webviewSlice'
import styles from './styles.module.scss'
import { Resizer } from './Resizer'
import { config } from './constants'
import { PlotsState } from '../store'
import { useGetPlot } from '../hooks/useGetPlot'
import { GripIcon } from '../../shared/components/dragDrop/GripIcon'
import { sendMessage } from '../../shared/vscode'

interface ZoomablePlotProps {
  spec?: VisualizationSpec
  id: string
  onViewReady?: () => void
  changeDisabledDragIds: (ids: string[]) => AnyAction
  changeSize: (nbItemsPerRow: number) => AnyAction
  currentSnapPoint: number
  height: number | undefined
  section: Section
  shouldNotResize?: boolean
}

export const ZoomablePlot: React.FC<ZoomablePlotProps> = ({
  spec: createdSpec,
  id,
  onViewReady,
  changeDisabledDragIds,
  changeSize,
  currentSnapPoint,
  section,
  shouldNotResize,
  height
}) => {
  const snapPoints = useSelector(
    (state: PlotsState) => state.webview.snapPoints
  )
  const { data, content: spec } = useGetPlot(section, id, createdSpec)
  const dispatch = useDispatch()
  const currentPlotProps = useRef<VegaLiteProps>()
  const clickDisabled = useRef(false)
  const enableClickTimeout = useRef(0)
  const [isExpanding, setIsExpanding] = useState(false)
  const size = snapPoints[currentSnapPoint - 1]

  const plotProps: VegaLiteProps = {
    actions: false,
    config,
    data,
    'data-testid': `${id}-vega`,
    renderer: 'svg' as unknown as Renderers,
    spec
  } as VegaLiteProps
  currentPlotProps.current = plotProps

  useEffect(() => {
    dispatch(
      setZoomedInPlot({ id, plot: currentPlotProps.current, refresh: true })
    )
  }, [data, spec, dispatch, id])

  useEffect(() => {
    return () => {
      window.clearTimeout(enableClickTimeout.current)
    }
  }, [])

  const handleOnClick = () =>
    !clickDisabled.current && dispatch(setZoomedInPlot({ id, plot: plotProps }))

  const onResize = useCallback(
    (newSnapPoint: number) => {
      dispatch(changeSize(newSnapPoint))
      sendMessage({
        payload: { height: undefined, nbItemsPerRow: newSnapPoint, section },
        type: MessageFromWebviewType.RESIZE_PLOTS
      })
    },
    [dispatch, changeSize, section]
  )

  const commonResizerProps = {
    onGrab: () => {
      clickDisabled.current = true
      dispatch(changeDisabledDragIds([id]))
    },
    onRelease: () => {
      dispatch(changeDisabledDragIds([]))
      enableClickTimeout.current = window.setTimeout(
        () => (clickDisabled.current = false),
        0
      )
    },
    onResize
  }
  if (!data && !spec) {
    return null
  }
  return (
    <button
      className={cx(styles.zoomablePlot, {
        [styles.plotExpanding]: isExpanding
      })}
      onClick={handleOnClick}
      style={{ height: height || (currentSnapPoint * 5) / 9 }}
    >
      <GripIcon className={styles.plotGripIcon} />
      {currentPlotProps.current && (
        <VegaLite {...plotProps} onNewView={onViewReady} />
      )}
      {!shouldNotResize && (
        <Resizer
          className={styles.plotVerticalResizer}
          {...commonResizerProps}
          snapPoints={snapPoints}
          currentSnapPoint={currentSnapPoint}
          sizeBetweenResizers={size} // 20 is the $gap set in styles.module.scss
          setIsExpanding={setIsExpanding}
        />
      )}
    </button>
  )
}
