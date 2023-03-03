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
  changeSize: (payload: {
    nbItemsPerRow: number
    height: number | undefined
  }) => AnyAction
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
  const [plotHeight, setPlotHeight] = useState<number | undefined>(height)
  const [projectedHeight, setProjectedHeight] = useState(plotHeight)

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

  useEffect(() => {
    if (height) {
      setPlotHeight(height)
    }
  }, [height])

  const handleOnClick = () =>
    !clickDisabled.current && dispatch(setZoomedInPlot({ id, plot: plotProps }))

  const onResize = useCallback(
    (nbItemsPerRow: number, height: number) => {
      dispatch(changeSize({ height, nbItemsPerRow }))
      sendMessage({
        payload: { height, nbItemsPerRow, section },
        type: MessageFromWebviewType.RESIZE_PLOTS
      })
    },
    [dispatch, changeSize, section]
  )

  const startResizing = useCallback(() => {
    clickDisabled.current = true
    dispatch(changeDisabledDragIds([id]))
  }, [dispatch, changeDisabledDragIds, id])

  const resetResizing = useCallback(() => {
    dispatch(changeDisabledDragIds([]))
    enableClickTimeout.current = window.setTimeout(
      () => (clickDisabled.current = false),
      0
    )
  }, [dispatch, changeDisabledDragIds])

  if (!data && !spec) {
    return null
  }

  return (
    <button
      className={cx(styles.zoomablePlot, {
        [styles.plotExpanding]: isExpanding
      })}
      onClick={handleOnClick}
      style={{
        height: shouldNotResize ? undefined : plotHeight
      }}
      ref={(node: HTMLButtonElement) =>
        !height &&
        node &&
        setPlotHeight((node.getBoundingClientRect().width * 5) / 9)
      }
    >
      <GripIcon className={styles.plotGripIcon} />
      {currentPlotProps.current && (
        <VegaLite {...plotProps} onNewView={onViewReady} />
      )}
      {!shouldNotResize && (
        <Resizer
          onGrab={startResizing}
          onRelease={resetResizing}
          onResize={onResize}
          snapPoints={snapPoints}
          currentSnapPoint={currentSnapPoint}
          sizeBetweenResizers={size}
          setIsExpanding={setIsExpanding}
          height={plotHeight}
          setProjectedHeight={setProjectedHeight}
        />
      )}
      <span
        className={styles.plotExpandingBorders}
        style={{ height: projectedHeight }}
      />
    </button>
  )
}
