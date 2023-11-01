import React, { DragEvent, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
import cx from 'classnames'
import { NoPlotsAdded } from './NoPlotsAdded'
import { changeDisabledDragIds } from './customPlotsSlice'
import styles from '../styles.module.scss'
import { shouldUseVirtualizedGrid } from '../util'
import { Grid } from '../Grid'
import { LoadingSection, sectionIsLoading } from '../LoadingSection'
import { PlotsState } from '../../store'
import { changeOrderWithDraggedInfo } from '../../../util/array'
import { reorderCustomPlots } from '../../util/messages'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'

interface CustomPlotsProps {
  plotsIds: string[]
}

export const CustomPlots: React.FC<CustomPlotsProps> = ({ plotsIds }) => {
  const dispatch = useDispatch()
  const [order, setOrder] = useState(plotsIds)
  const {
    nbItemsPerRow,
    hasData,
    hasItems,
    hasAddedPlots,
    disabledDragPlotIds,
    hasUnfilteredExperiments
  } = useSelector((state: PlotsState) => state.custom)
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
    >
      <Grid
        setOrder={setPlotsIdsOrder}
        nbItemsPerRow={nbItemsPerRow}
        useVirtualizedGrid={useVirtualizedGrid}
        order={order}
        groupId="custom-plots"
        parentDraggedOver={onSection}
        disabledDragPlotIds={disabledDragPlotIds}
        changeDisabledDragIds={(disabled: string[]) =>
          dispatch(changeDisabledDragIds(disabled))
        }
        sectionKey={PlotsSection.CUSTOM_PLOTS}
      />
    </div>
  )
}
