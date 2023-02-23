import React, { DragEvent, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import cx from 'classnames'
import { performSimpleOrderedUpdate } from 'dvc/src/util/array'
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
import { LoadingSection, sectionIsLoading } from '../LoadingSection'

interface CustomPlotsProps {
  plotsIds: string[]
}

export const CustomPlots: React.FC<CustomPlotsProps> = ({ plotsIds }) => {
  const [order, setOrder] = useState(plotsIds)
  const { size, hasData, disabledDragPlotIds } = useSelector(
    (state: PlotsState) => state.custom
  )
  const [onSection, setOnSection] = useState(false)
  const nbItemsPerRow = size

  const selectedRevisions = useSelector(
    (state: PlotsState) => state.webview.selectedRevisions
  )

  useEffect(() => {
    setOrder(pastOrder => performSimpleOrderedUpdate(pastOrder, plotsIds))
  }, [plotsIds])

  if (sectionIsLoading(selectedRevisions)) {
    return <LoadingSection />
  }

  if (!hasData) {
    return <EmptyState isFullScreen={false}>No Plots to Display</EmptyState>
  }

  const items = order.map(plot => (
    <div key={plot} id={plot}>
      <CustomPlot id={plot} />
    </div>
  ))

  const useVirtualizedGrid = shouldUseVirtualizedGrid(items.length, size)

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setOnSection(true)
  }

  return items.length > 0 ? (
    <div
      data-testid="custom-plots"
      id="custom-plots"
      className={cx(styles.singleViewPlotsGrid, {
        [styles.noBigGrid]: !useVirtualizedGrid
      })}
      onDragEnter={() => setOnSection(true)}
      onDragLeave={() => setOnSection(false)}
      onDragOver={handleDragOver}
    >
      <DragDropContainer
        order={order}
        setOrder={setOrder}
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
  ) : (
    <EmptyState isFullScreen={false}>No plots added</EmptyState>
  )
}
