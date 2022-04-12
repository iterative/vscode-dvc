import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import {
  CheckpointPlotData,
  CheckpointPlotsColors
} from 'dvc/src/plots/webview/contract'
import React, { useEffect, useState } from 'react'
import { Plot } from './Plot'
import styles from '../styles.module.scss'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { DragDropContainer } from '../../../shared/components/dragDrop/DragDropContainer'
import { performOrderedUpdate } from '../../../util/objects'
import { withScale } from '../../../util/styles'
import { GripIcon } from '../../../shared/components/dragDrop/GripIcon'
import { sendMessage } from '../../../shared/vscode'
import { DropTarget } from '../DropTarget'

interface CheckpointPlotsProps {
  plots: CheckpointPlotData[]
  colors: CheckpointPlotsColors
  onPlotClick: (plot: JSX.Element) => void
}

export const CheckpointPlots: React.FC<CheckpointPlotsProps> = ({
  plots,
  colors,
  onPlotClick
}) => {
  const [order, setOrder] = useState(plots.map(plot => plot.title))

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
      const plotJSX = <Plot values={values} scale={colors} title={title} />

      return (
        <div
          className={styles.plot}
          style={withScale(1)}
          id={title}
          key={key}
          data-testid={key}
          onClick={() => onPlotClick(plotJSX)}
        >
          <GripIcon className={styles.plotGripIcon} />
          {plotJSX}
        </div>
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
        dropTarget={<DropTarget />}
      />
    </div>
  ) : (
    <EmptyState isFullScreen={false}>No Metrics Selected</EmptyState>
  )
}
