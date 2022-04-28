import React, { useEffect, useState } from 'react'
import { VegaLiteProps } from 'react-vega/lib/VegaLite'
import { CheckpointPlotData, ColorScale } from 'dvc/src/plots/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { createSpec } from './util'
import styles from '../styles.module.scss'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { DragDropContainer } from '../../../shared/components/dragDrop/DragDropContainer'
import { performOrderedUpdate } from '../../../util/objects'
import { withScale } from '../../../util/styles'
import { sendMessage } from '../../../shared/vscode'
import { config } from '../constants'
import { DropTarget } from '../DropTarget'
import { ZoomablePlot, ZoomablePlotProps } from '../ZoomablePlot'

interface CheckpointPlotsProps extends ZoomablePlotProps {
  plots: CheckpointPlotData[]
  colors: ColorScale
}

export const CheckpointPlots: React.FC<CheckpointPlotsProps> = ({
  plots,
  colors,
  renderZoomedInPlot
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
      const spec = createSpec(title, colors)
      const plotProps = {
        config,
        data: { values },
        'data-testid': `${key}-vega`,
        renderer: 'svg',
        spec
      } as VegaLiteProps

      return (
        <div
          key={key}
          className={styles.plot}
          data-testid={key}
          id={title}
          style={withScale(1)}
        >
          <ZoomablePlot
            plotProps={plotProps}
            id={key}
            renderZoomedInPlot={renderZoomedInPlot}
          />
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
