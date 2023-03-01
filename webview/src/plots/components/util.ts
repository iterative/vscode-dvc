import { PlotNumberOfItemsPerRow } from 'dvc/src/plots/webview/contract'

export const DEFAULT_NB_ITEMS_PER_ROW = PlotNumberOfItemsPerRow.REGULAR

const MaxItemsBeforeVirtualization = {
  [PlotNumberOfItemsPerRow.LARGE]: 10,
  [PlotNumberOfItemsPerRow.REGULAR]: 15,
  [PlotNumberOfItemsPerRow.SMALL]: 18,
  [PlotNumberOfItemsPerRow.SMALLER]: 20
}

export const shouldUseVirtualizedGrid = (
  nbItems: number,
  nbItemsPerRow: number
) => nbItems > MaxItemsBeforeVirtualization[nbItemsPerRow]
