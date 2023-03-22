import React, { DragEvent, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import cx from 'classnames'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { CustomPlot } from './CustomPlot'
import styles from '../styles.module.scss'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import {
  DragDropContainer,
  WrapperProps
} from '../../../shared/components/dragDrop/DragDropContainer'
import { DropTarget } from '../DropTarget'
import { VirtualizedGrid } from '../../../shared/components/virtualizedGrid/VirtualizedGrid'
import { shouldUseVirtualizedGrid } from '../util'
import { PlotsState } from '../../store'
import { sendMessage } from '../../../shared/vscode'
import { changeOrderWithDraggedInfo } from '../../../util/array'
import { LoadingSection, sectionIsLoading } from '../LoadingSection'

interface CustomPlotsProps {
  plotsIds: string[]
}

export const CustomPlots: React.FC<CustomPlotsProps> = ({ plotsIds }) => {
  const [order, setOrder] = useState(plotsIds)
  const { nbItemsPerRow, hasData, disabledDragPlotIds } = useSelector(
    (state: PlotsState) => state.custom
  )
  const [onSection, setOnSection] = useState(false)
  const draggedRef = useSelector(
    (state: PlotsState) => state.dragAndDrop.draggedRef
  )
  const selectedRevisions = useSelector(
    (state: PlotsState) => state.webview.selectedRevisions
  )

  useEffect(() => {
    setOrder(plotsIds)
  }, [plotsIds])

  const setPlotsIdsOrder = (order: string[]): void => {
    setOrder(order)
    sendMessage({
      payload: order,
      type: MessageFromWebviewType.REORDER_PLOTS_CUSTOM
    })
  }

  if (sectionIsLoading(selectedRevisions)) {
    return <LoadingSection />
  }

  if (!hasData) {
    return <EmptyState isFullScreen={false}>No Plots to Display</EmptyState>
  }

  if (order.length === 0) {
    return <EmptyState isFullScreen={false}>No Plots Added</EmptyState>
  }

  const items = order.map(plot => (
    <div key={plot} id={plot}>
      <CustomPlot id={plot} />
    </div>
  ))

  const useVirtualizedGrid = shouldUseVirtualizedGrid(
    items.length,
    nbItemsPerRow
  )

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setOnSection(true)
  }

  const handleDropAtTheEnd = () => {
    setPlotsIdsOrder(changeOrderWithDraggedInfo(order, draggedRef))
  }
  return (
    <div
      data-testid="custom-plots"
      id="custom-plots"
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
        setOrder={setPlotsIdsOrder}
        disabledDropIds={disabledDragPlotIds}
        items={items}
        group="custom-plots"
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
  )
}
