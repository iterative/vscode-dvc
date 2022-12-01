import React, { DragEvent, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import cx from 'classnames'
import { ColorScale } from 'dvc/src/plots/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { performSimpleOrderedUpdate } from 'dvc/src/util/array'
import { CheckpointPlot } from './CheckpointPlot'
import styles from '../styles.module.scss'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import {
  DragDropContainer,
  WrapperProps
} from '../../../shared/components/dragDrop/DragDropContainer'
import { sendMessage } from '../../../shared/vscode'
import { DropTarget } from '../DropTarget'
import { VirtualizedGrid } from '../../../shared/components/virtualizedGrid/VirtualizedGrid'
import { shouldUseVirtualizedGrid } from '../util'
import { PlotsState } from '../../store'
import { changeOrderWithDraggedInfo } from '../../../util/array'
import { LoadingSection, sectionIsLoading } from '../LoadingSection'

interface CheckpointPlotsProps {
  plotsIds: string[]
  colors: ColorScale
}

export const CheckpointPlots: React.FC<CheckpointPlotsProps> = ({
  plotsIds,
  colors
}) => {
  const [order, setOrder] = useState(plotsIds)
  const { size, hasData, disabledDragPlotIds } = useSelector(
    (state: PlotsState) => state.checkpoint
  )
  const [onSection, setOnSection] = useState(false)
  const nbItemsPerRow = size
  const draggedRef = useSelector(
    (state: PlotsState) => state.dragAndDrop.draggedRef
  )

  const selectedRevisions = useSelector(
    (state: PlotsState) => state.webview.selectedRevisions
  )

  useEffect(() => {
    setOrder(pastOrder => performSimpleOrderedUpdate(pastOrder, plotsIds))
  }, [plotsIds])

  const setMetricOrder = (order: string[]): void => {
    setOrder(order)
    sendMessage({
      payload: order,
      type: MessageFromWebviewType.REORDER_PLOTS_METRICS
    })
  }

  if (sectionIsLoading(selectedRevisions)) {
    return <LoadingSection />
  }

  if (!hasData) {
    return <EmptyState isFullScreen={false}>No Plots to Display</EmptyState>
  }

  const items = order.map(plot => (
    <div key={plot} id={plot}>
      <CheckpointPlot id={plot} colors={colors} />
    </div>
  ))

  const useVirtualizedGrid = shouldUseVirtualizedGrid(items.length, size)

  const handleDropAtTheEnd = () => {
    setMetricOrder(changeOrderWithDraggedInfo(order, draggedRef))
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setOnSection(true)
  }

  return items.length > 0 ? (
    <div
      data-testid="checkpoint-plots"
      id="checkpoint-plots"
      className={cx(styles.singleViewPlotsGrid, {
        [styles.noBigGrid]: !useVirtualizedGrid
      })}
      onDragEnter={() => setOnSection(true)}
      onDragLeave={() => setOnSection(false)}
      onDragOver={handleDragOver}
      onDrop={handleDropAtTheEnd}
    >
      <DragDropContainer
        order={order}
        setOrder={setMetricOrder}
        disabledDropIds={disabledDragPlotIds}
        items={items as JSX.Element[]}
        group="live-plots"
        dropTarget={<DropTarget />}
        wrapperComponent={
          useVirtualizedGrid
            ? {
                component: VirtualizedGrid as React.FC<WrapperProps>,
                props: { nbItemsPerRow }
              }
            : undefined
        }
        parentDraggedOver={onSection}
      />
    </div>
  ) : (
    <EmptyState isFullScreen={false}>No Metrics Selected</EmptyState>
  )
}
