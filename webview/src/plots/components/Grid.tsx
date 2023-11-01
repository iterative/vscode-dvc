import React from 'react'
import { useSelector } from 'react-redux'
import { NormalGrid, NormalGridProps } from './NormalGrid'
import { DragAndDropGrid } from './DragAndDropGrid'
import { isDragAndDropModeSelector } from './util'
import { PlotsState } from '../store'
import { OnDrop } from '../../shared/components/dragDrop/DragDropContainer'

interface GridProps extends NormalGridProps {
  setOrder: (order: string[]) => void
  order: string[]
  groupId: string
  onDrop?: OnDrop
  parentDraggedOver?: boolean
  disabledDragPlotIds: string[]
}

export const Grid: React.FC<GridProps> = ({
  setOrder,
  useVirtualizedGrid,
  nbItemsPerRow,
  order,
  groupId,
  onDrop,
  parentDraggedOver,
  disabledDragPlotIds,
  multiView,
  changeDisabledDragIds,
  sectionKey
}) => {
  const isInDragAndDropMode = useSelector((state: PlotsState) =>
    isDragAndDropModeSelector(state, sectionKey)
  )
  return isInDragAndDropMode ? (
    <DragAndDropGrid
      order={order}
      useVirtualizedGrid={useVirtualizedGrid}
      nbItemsPerRow={nbItemsPerRow}
      multiView={multiView}
      setOrder={setOrder}
      groupId={groupId}
      onDrop={onDrop}
      parentDraggedOver={parentDraggedOver}
      disabledDragPlotIds={disabledDragPlotIds}
    />
  ) : (
    <NormalGrid
      useVirtualizedGrid={useVirtualizedGrid}
      nbItemsPerRow={nbItemsPerRow}
      order={order}
      multiView={multiView}
      changeDisabledDragIds={changeDisabledDragIds}
      sectionKey={sectionKey}
    />
  )
}
