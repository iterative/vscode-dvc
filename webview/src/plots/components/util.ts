import { PlotNumberOfItemsPerRow } from 'dvc/src/plots/webview/contract'

export const DEFAULT_NB_ITEMS_PER_ROW = PlotNumberOfItemsPerRow.TWO

const MaxItemsBeforeVirtualization = {
  [PlotNumberOfItemsPerRow.ONE]: 10,
  [PlotNumberOfItemsPerRow.TWO]: 15,
  [PlotNumberOfItemsPerRow.THREE]: 18,
  [PlotNumberOfItemsPerRow.FOUR]: 20
}

export const shouldUseVirtualizedGrid = (
  nbItems: number,
  nbItemsPerRow: number
) => nbItems > MaxItemsBeforeVirtualization[nbItemsPerRow]
