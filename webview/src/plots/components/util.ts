import { PlotSizeNumber } from 'dvc/src/plots/webview/contract'

export const DEFAULT_NB_ITEMS_PER_ROW = 4

// eslint-disable-next-line sonarjs/cognitive-complexity
export const getNbItemsPerRow = (size: number) => {
  const { innerWidth } = window
  if (innerWidth >= 2000) {
    const maxPlotSize = size === PlotSizeNumber.SMALL ? size * 1.666 : size * 2
    return Math.floor(innerWidth / maxPlotSize)
  }

  if (innerWidth >= 1600) {
    return Math.floor(1999 / size)
  }

  if (innerWidth >= 800) {
    return Math.round(1599 / size) - 1
  }

  return size === PlotSizeNumber.SMALL && innerWidth >= 600 ? 2 : 1
}

const MaxItemsBeforeVirtualization = {
  [PlotSizeNumber.LARGE]: 10,
  [PlotSizeNumber.REGULAR]: 15,
  [PlotSizeNumber.SMALL]: 20
}

export const shouldUseVirtualizedGrid = (nbItems: number, size: number) =>
  nbItems >
  MaxItemsBeforeVirtualization[
    size as keyof typeof MaxItemsBeforeVirtualization
  ]
