import React, { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import VegaLite from 'react-vega/lib/VegaLite'
import { setZoomedInPlot } from './webviewSlice'
import styles from './styles.module.scss'
import { GripIcon } from '../../shared/components/dragDrop/GripIcon'

interface ZoomablePlotProps {
  plotProps: string
  id: string
}

export const ZoomablePlot: React.FC<ZoomablePlotProps> = ({
  plotProps,
  id
}) => {
  const parsedProps = JSON.parse(plotProps)
  const dispatch = useDispatch()
  const previousPlotProps = useRef(parsedProps)
  useEffect(() => {
    if (previousPlotProps.current !== plotProps) {
      dispatch(setZoomedInPlot({ id, plot: plotProps, refresh: true }))
      previousPlotProps.current = plotProps
    }
  }, [plotProps, id, dispatch])

  const handleOnClick = () => dispatch(setZoomedInPlot({ id, plot: plotProps }))

  return (
    <button className={styles.zoomablePlot} onClick={handleOnClick}>
      <GripIcon className={styles.plotGripIcon} />
      <VegaLite {...parsedProps} />
    </button>
  )
}
