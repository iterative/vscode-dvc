import React, { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import VegaLite, { VegaLiteProps } from 'react-vega/lib/VegaLite'
import styles from './styles.module.scss'
import { GripIcon } from '../../shared/components/dragDrop/GripIcon'
import { setZoomedInPlot } from './webviewSlice'

interface ZoomablePlotProps {
  plotProps: VegaLiteProps
  id: string
}

export const ZoomablePlot: React.FC<ZoomablePlotProps> = ({
  plotProps,
  id
}) => {
  const dispatch = useDispatch()
  const previousPlotProps = useRef(plotProps)
  useEffect(() => {
    if (
      JSON.stringify(previousPlotProps.current) !== JSON.stringify(plotProps)
    ) {
      dispatch(setZoomedInPlot({ plot: plotProps, id, refresh: true }))
      previousPlotProps.current = plotProps
    }
  }, [plotProps, id, dispatch])
  debugger

  const handleOnClick = () => dispatch(setZoomedInPlot({ plot: plotProps, id }))

  return (
    <button className={styles.zoomablePlot} onClick={handleOnClick}>
      <GripIcon className={styles.plotGripIcon} />
      <VegaLite {...plotProps} />
    </button>
  )
}
