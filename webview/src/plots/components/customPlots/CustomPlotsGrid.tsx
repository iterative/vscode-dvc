import React from 'react'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
import { Grid } from '../Grid'

interface CustomPlotsGridProps {
  nbItemsPerRow: number
  order: string[]
  parentDraggedOver: boolean
  useVirtualizedGrid?: boolean
  setOrder: (order: string[]) => void
}

export const CustomPlotsGrid: React.FC<CustomPlotsGridProps> = ({
  nbItemsPerRow,
  parentDraggedOver,
  order,
  setOrder,
  useVirtualizedGrid
}) => {
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
