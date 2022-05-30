import React, { useEffect, useRef } from 'react'
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
}

export const ZoomablePlot: React.FC<ZoomablePlotOwnProps> = ({
  plotProps,
  renderZoomedInPlot,
  id
}) => {
  const previousPlotProps = useRef(plotProps)
  useEffect(() => {
    if (
      JSON.stringify(previousPlotProps.current) !== JSON.stringify(plotProps)
    ) {
      renderZoomedInPlot(plotProps, id, true)
      previousPlotProps.current = plotProps
    }
  }, [plotProps, id, renderZoomedInPlot])

  const handleOnClick = () => {
    const zoomedPlotWithLegend = { ...plotProps } as VegaLiteProps & {
      spec: { encoding?: { color?: { legend?: { disable?: boolean } } } }
    }
    if (
      zoomedPlotWithLegend.spec.encoding?.color?.legend?.disable !== undefined
    ) {
      delete zoomedPlotWithLegend.spec.encoding.color.legend.disable
    }
    return renderZoomedInPlot(zoomedPlotWithLegend, id)
  }

  return (
    <button className={styles.zoomablePlot} onClick={handleOnClick}>
      <GripIcon className={styles.plotGripIcon} />
      <VegaLite {...plotProps} />
    </button>
  )
}
