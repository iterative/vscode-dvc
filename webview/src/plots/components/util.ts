import { PlotSizeNumber } from 'dvc/src/plots/webview/contract'

export const DEFAULT_NB_ITEMS_PER_ROW = 2

const MaxItemsBeforeVirtualization = {
  [PlotSizeNumber.LARGE]: 10,
  [PlotSizeNumber.REGULAR]: 15,
  [PlotSizeNumber.SMALL]: 18,
  [PlotSizeNumber.SMALLER]: 20
}

export const shouldUseVirtualizedGrid = (nbItems: number, size: number) =>
  nbItems >
  MaxItemsBeforeVirtualization[
    size as keyof typeof MaxItemsBeforeVirtualization
  ]
