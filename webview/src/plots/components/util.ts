import { PlotWidthNumber } from 'dvc/src/plots/webview/contract'

export const DEFAULT_NB_ITEMS_PER_ROW = PlotWidthNumber.REGULAR

const MaxItemsBeforeVirtualization = {
  [PlotWidthNumber.LARGE]: 10,
  [PlotWidthNumber.REGULAR]: 15,
  [PlotWidthNumber.SMALL]: 18,
  [PlotWidthNumber.SMALLER]: 20
}

export const shouldUseVirtualizedGrid = (
  nbItems: number,
  nbItemsPerRow: number
) => nbItems > MaxItemsBeforeVirtualization[nbItemsPerRow]
