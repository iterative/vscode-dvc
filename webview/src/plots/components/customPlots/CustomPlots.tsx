import React, { DragEvent, useEffect, useRef, useState } from 'react'
import cx from 'classnames'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
import { useSelector } from 'react-redux'
import { NoPlotsAdded } from './NoPlotsAdded'
import { CustomPlotsGrid } from './CustomPlotsGrid'
import styles from '../styles.module.scss'
import { shouldUseVirtualizedGrid } from '../util'
import { LoadingSection, sectionIsLoading } from '../LoadingSection'
import { PlotsState } from '../../store'
import { changeOrderWithDraggedInfo } from '../../../util/array'
import { reorderCustomPlots } from '../../util/messages'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { useObserveGridDimensions } from '../../hooks/useObserveGridDimensions'

interface CustomPlotsProps {
  plotsIds: string[]
}

export const CustomPlots: React.FC<CustomPlotsProps> = ({ plotsIds }) => {
  const [order, setOrder] = useState(plotsIds)
  const {
    nbItemsPerRow,
    hasData,
    hasItems,
    hasAddedPlots,
    hasUnfilteredExperiments
  } = useSelector((state: PlotsState) => state.custom)
  const [onSection, setOnSection] = useState(false)
  const draggedRef = useSelector(
    (state: PlotsState) => state.dragAndDrop.draggedRef
  )
  const selectedRevisions = useSelector(
    (state: PlotsState) => state.webview.selectedRevisions
  )

  const gridRef = useRef<HTMLDivElement>(null)
  useObserveGridDimensions(PlotsSection.CUSTOM_PLOTS, gridRef)

  useEffect(() => {
    setOrder(plotsIds)
  }, [plotsIds])

  const setPlotsIdsOrder = (order: string[]): void => {
    setOrder(order)
    reorderCustomPlots(order)
  }

  if (sectionIsLoading(selectedRevisions, hasItems)) {
    return <LoadingSection />
  }

  if (!hasData) {
    return <EmptyState isFullScreen={false}>No Plots to Display</EmptyState>
  }

  if (!hasAddedPlots) {
    return <NoPlotsAdded />
  }

  if (!hasUnfilteredExperiments) {
    return <EmptyState isFullScreen={false}>No Data to Plot</EmptyState>
  }

  const useVirtualizedGrid = shouldUseVirtualizedGrid(
    order.length,
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
      ref={gridRef}
    >
      <CustomPlotsGrid
        nbItemsPerRow={nbItemsPerRow}
        order={order}
        parentDraggedOver={onSection}
        setOrder={setPlotsIdsOrder}
        useVirtualizedGrid={useVirtualizedGrid}
      />
    </div>
  )
}
