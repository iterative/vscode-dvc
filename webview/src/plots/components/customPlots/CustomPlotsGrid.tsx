import React, { RefObject } from 'react'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
import { useObserveGridDimensions } from '../../hooks/useObserveGridDimensions'
import { Grid } from '../Grid'

interface CustomPlotsGridProps {
  gridRef: RefObject<HTMLDivElement>
  nbItemsPerRow: number
  order: string[]
  parentDraggedOver: boolean
  useVirtualizedGrid?: boolean
  setOrder: (order: string[]) => void
}

export const CustomPlotsGrid: React.FC<CustomPlotsGridProps> = ({
  gridRef,
  nbItemsPerRow,
  parentDraggedOver,
  order,
  setOrder,
  useVirtualizedGrid
}) => {
  useObserveGridDimensions(PlotsSection.CUSTOM_PLOTS, gridRef)

  return (
    <Grid
      setOrder={setOrder}
      nbItemsPerRow={nbItemsPerRow}
      useVirtualizedGrid={useVirtualizedGrid}
      order={order}
      groupId="custom-plots"
      parentDraggedOver={parentDraggedOver}
      sectionKey={PlotsSection.CUSTOM_PLOTS}
    />
  )
}
