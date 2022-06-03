import React, { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import VegaLite, { VegaLiteProps } from 'react-vega/lib/VegaLite'
import styles from './styles.module.scss'
import { GripIcon } from '../../shared/components/dragDrop/GripIcon'
import { setZoomedInPlot } from './webviewSlice'

interface ZoomablePlotProps {
  plotProps: string
  id: string
}

export const ZoomablePlot: React.FC<ZoomablePlotProps> = ({
  plotProps,
  id
}) => {
  const persedProps = JSON.parse(plotProps)
  const dispatch = useDispatch()
  const previousPlotProps = useRef(persedProps)
  useEffect(() => {
    if (previousPlotProps.current !== plotProps) {
      dispatch(setZoomedInPlot({ plot: persedProps, id, refresh: true }))
      previousPlotProps.current = plotProps
    }
  }, [plotProps, id, dispatch])

  const handleOnClick = () =>
    dispatch(setZoomedInPlot({ plot: persedProps, id }))

  return (
    <button className={styles.zoomablePlot} onClick={handleOnClick}>
      <GripIcon className={styles.plotGripIcon} />
      <VegaLite {...persedProps} />
    </button>
  )
}
