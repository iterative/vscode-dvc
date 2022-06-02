import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { VegaLiteProps } from 'react-vega/lib/VegaLite'
import cx from 'classnames'
import { CheckpointPlotData, ColorScale } from 'dvc/src/plots/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { createSpec } from './util'
import styles from '../styles.module.scss'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import {
  DragDropContainer,
  WrapperProps
} from '../../../shared/components/dragDrop/DragDropContainer'
import { performOrderedUpdate } from '../../../util/objects'
import { withScale } from '../../../util/styles'
import { sendMessage } from '../../../shared/vscode'
import { config } from '../constants'
import { DropTarget } from '../DropTarget'
import { ZoomablePlot } from '../ZoomablePlot'
import { VirtualizedGrid } from '../../../shared/components/virtualizedGrid/VirtualizedGrid'
import { shouldUseVirtualizedGrid } from '../util'
import { useNbItemsPerRow } from '../../hooks/useNbItemsPerRow'
import { RootState } from '../../store'

interface CheckpointPlotsProps {
  plots: CheckpointPlotData[]
  colors: ColorScale
}

export const CheckpointPlots: React.FC<CheckpointPlotsProps> = ({
  plots,
  colors
}) => {
  const [order, setOrder] = useState(plots.map(plot => plot.title))
  const { size } = useSelector((state: RootState) => state.checkpoint)
  const nbItemsPerRow = useNbItemsPerRow(size)

  useEffect(() => {
    setOrder(pastOrder => performOrderedUpdate(pastOrder, plots, 'title'))
  }, [plots])

  const setMetricOrder = (order: string[]): void => {
    setOrder(order)
    sendMessage({
      payload: order,
      type: MessageFromWebviewType.REORDER_PLOTS_METRICS
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
          <ZoomablePlot plotProps={plotProps} id={key} />
        </div>
      )
    })
    .filter(Boolean)

  const useVirtualizedGrid = shouldUseVirtualizedGrid(items.length, size)

  return plots.length > 0 ? (
    <div
      className={cx(styles.singleViewPlotsGrid, {
        [styles.noBigGrid]: !useVirtualizedGrid
      })}
    >
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
        wrapperComponent={
          useVirtualizedGrid
            ? {
                component: VirtualizedGrid as React.FC<WrapperProps>,
                props: { nbItemsPerRow }
              }
            : undefined
        }
      />
    </div>
  ) : (
    <EmptyState isFullScreen={false}>No Metrics Selected</EmptyState>
  )
}
