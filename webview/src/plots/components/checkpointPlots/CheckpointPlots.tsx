import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import {
  CheckpointPlotData,
  CheckpointPlotsColors
} from 'dvc/src/plots/webview/contract'
import React, { useEffect, useRef, useState } from 'react'
import VegaLite, { VegaLiteProps } from 'react-vega/lib/VegaLite'
import { Renderers } from 'vega'
import { createSpec } from './util'
import styles from '../styles.module.scss'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import {
  DragDropContainer,
  DraggedInfo
} from '../../../shared/components/dragDrop/DragDropContainer'
import { performOrderedUpdate } from '../../../util/objects'
import { sendMessage } from '../../../shared/vscode'
import { DropTarget } from '../DropTarget'
import { withScale } from '../../../util/styles'
import { GripIcon } from '../../../shared/components/dragDrop/GripIcon'
import { config } from '../constants'

interface CheckpointPlotsProps {
  plots: CheckpointPlotData[]
  colors: CheckpointPlotsColors
  onPlotClick: (plot: VegaLiteProps) => void
}

export const CheckpointPlots: React.FC<CheckpointPlotsProps> = ({
  plots,
  colors,
  onPlotClick
}) => {
  const [order, setOrder] = useState(plots.map(plot => plot.title))
  const draggedRef = useRef<DraggedInfo>()

  useEffect(() => {
    setOrder(pastOrder => performOrderedUpdate(pastOrder, plots, 'title'))
  }, [plots])

  const setMetricOrder = (order: string[]): void => {
    setOrder(order)
    sendMessage({
      payload: order,
      type: MessageFromWebviewType.PLOTS_METRICS_REORDERED
    })
  }

  const items = order
    .map(plot => {
      const plotData = plots.find(p => p.title === plot)
      if (!plotData) {
        return
      }
      const { title, values } = plotData
      const key = `plot-${title}`
      const spec = createSpec(title, colors)
      const plotProps = {
        actions: false,
        config,
        data: { values },
        renderer: 'svg' as Renderers,
        spec
      }

      return (
        <button
          key={key}
          className={styles.plot}
          style={withScale(1)}
          id={title}
          data-testid={key}
          onClick={() => onPlotClick(plotProps)}
        >
          <GripIcon className={styles.plotGripIcon} />
          <VegaLite {...plotProps} />
        </button>
      )
    })
    .filter(Boolean)

  return plots.length > 0 ? (
    <div className={styles.singleViewPlotsGrid}>
      <DragDropContainer
        order={order}
        setOrder={setMetricOrder}
        disabledDropIds={[]}
        items={items as JSX.Element[]}
        group="live-plots"
        draggedRef={draggedRef}
        dropTarget={{
          element: <DropTarget />,
          wrapperTag: 'div'
        }}
      />
    </div>
  ) : (
    <EmptyState isFullScreen={false}>No Metrics Selected</EmptyState>
  )
}
