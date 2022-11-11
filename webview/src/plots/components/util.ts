import { PlotSizeNumber } from 'dvc/src/plots/webview/contract'

export const DEFAULT_NB_ITEMS_PER_ROW = 2

const MaxItemsBeforeVirtualization = {
  [PlotSizeNumber.LARGE]: 10,
  [PlotSizeNumber.REGULAR]: 15,
  [PlotSizeNumber.MEDIUM]: 18,
  [PlotSizeNumber.SMALL]: 20
}

export const shouldUseVirtualizedGrid = (nbItems: number, size: number) =>
  nbItems >
  MaxItemsBeforeVirtualization[
    size as keyof typeof MaxItemsBeforeVirtualization
  ]
