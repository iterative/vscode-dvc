import cx from 'classnames'
import React, { useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { PlainObject, VisualizationSpec } from 'react-vega'
import { Renderers } from 'vega'
import VegaLite, { VegaLiteProps } from 'react-vega/lib/VegaLite'
import { setZoomedInPlot } from './webviewSlice'
import styles from './styles.module.scss'
import { Resizer } from './Resizer'
import { config } from './constants'
import { GripIcon } from '../../shared/components/dragDrop/GripIcon'

interface ZoomablePlotProps {
  spec: VisualizationSpec
  data?: PlainObject
  id: string
  onViewReady?: () => void
  toggleDrag: (enabled: boolean) => void
  onResize: (diff: number) => void
  snapPoints: number[]
  currentSnapPoint: number
  size: number
  index: number
}

export const ZoomablePlot: React.FC<ZoomablePlotProps> = ({
  spec,
  data,
  id,
  onViewReady,
  toggleDrag,
  onResize,
  snapPoints,
  currentSnapPoint,
  size,
  index
}) => {
  const dispatch = useDispatch()
  const previousSpecsAndData = useRef(JSON.stringify({ data, spec }))
  const currentPlotProps = useRef<VegaLiteProps>()
  const clickDisabled = useRef(false)
  const enableClickTimeout = useRef(0)
  const [isExpanding, setIsExpanding] = useState(false)
  const newSpecsAndData = JSON.stringify({ data, spec })

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
    if (previousSpecsAndData.current !== newSpecsAndData) {
      dispatch(
        setZoomedInPlot({ id, plot: currentPlotProps.current, refresh: true })
      )
      previousSpecsAndData.current = newSpecsAndData
    }
  }, [newSpecsAndData, id, dispatch])

  useEffect(() => {
    return () => {
      window.clearTimeout(enableClickTimeout.current)
    }
  }, [])

  const handleOnClick = () =>
    !clickDisabled.current && dispatch(setZoomedInPlot({ id, plot: plotProps }))

  const commonResizerProps = {
    onGrab: () => {
      clickDisabled.current = true
      toggleDrag(false)
    },
    onRelease: () => {
      toggleDrag(true)
      enableClickTimeout.current = window.setTimeout(
        () => (clickDisabled.current = false),
        0
      )
    },
    onResize
  }
  return (
    <button
      className={cx(styles.zoomablePlot, {
        [styles.plotExpanding]: isExpanding
      })}
      onClick={handleOnClick}
    >
      <GripIcon className={styles.plotGripIcon} />
      {currentPlotProps.current && (
        <VegaLite {...plotProps} onNewView={onViewReady} />
      )}
      <Resizer
        className={styles.plotVerticalResizer}
        {...commonResizerProps}
        snapPoints={snapPoints}
        currentSnapPoint={currentSnapPoint}
        sizeBetweenResizers={size} // 20 is the $gap set in styles.module.scss
        index={index}
        setIsExpanding={setIsExpanding}
      />
    </button>
  )
}
