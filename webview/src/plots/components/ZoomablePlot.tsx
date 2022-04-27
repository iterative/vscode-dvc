import React, { useEffect, HTMLAttributes } from 'react'
import VegaLite, { VegaLiteProps } from 'react-vega/lib/VegaLite'
import styles from './styles.module.scss'
import { GripIcon } from '../../shared/components/dragDrop/GripIcon'

export interface ZoomablePlotProps {
  renderZoomedInPlot: (
    plot: VegaLiteProps,
    id: string,
    refresh?: boolean
  ) => void
}

interface ZoomablePlotOwnProps extends ZoomablePlotProps {
  plotProps: VegaLiteProps
  id: string
  wrapperProps: HTMLAttributes<HTMLButtonElement>
}

export const ZoomablePlot: React.FC<ZoomablePlotOwnProps> = ({
  plotProps,
  renderZoomedInPlot,
  id,
  wrapperProps
}) => {
  useEffect(() => {
    renderZoomedInPlot(plotProps, id, true)
  }, [plotProps, id, renderZoomedInPlot])

  const handleOnClick = () => renderZoomedInPlot(plotProps, id)

  return (
    <button {...wrapperProps} onClick={handleOnClick}>
      <GripIcon className={styles.plotGripIcon} />
      <VegaLite {...plotProps} />
    </button>
  )
}
