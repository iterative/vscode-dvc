import React from 'react'
import { OnDrop } from '../../shared/components/dragDrop/DragDropContainer'
import { NormalGrid, NormalGridProps } from './NormalGrid'
import { DragAndDropGrid } from './DragAndDropGrid'

interface GridProps extends NormalGridProps {
  setOrder: (order: string[]) => void
  order: string[]
  groupId: string
  onDrop: OnDrop
  parentDraggedOver?: boolean
  disabledDragPlotIds: string[]
  isInDragAndDropMode?: boolean
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
  isInDragAndDropMode,
  multiView,
  changeDisabledDragIds,
  sectionKey
}) => {
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
