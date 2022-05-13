import { PlotSize } from 'dvc/src/plots/webview/contract'

export const MaxItemsBeforeVirtualization = {
  [PlotSize.LARGE]: 6,
  [PlotSize.REGULAR]: 8,
  [PlotSize.SMALL]: 20
}

const maxPlotSize = {
  [PlotSize.LARGE]: 1000,
  [PlotSize.REGULAR]: 800,
  [PlotSize.SMALL]: 500
}

export const DEFAULT_NB_ITEMS_PER_ROW = 4

const getNbItemsPerRow1600w = (size: PlotSize) => {
  switch (size) {
    case PlotSize.LARGE:
      return 3
    case PlotSize.SMALL:
      return 6
    case PlotSize.REGULAR:
    default:
      return 4
  }
}

const getNbItemsPerRow800w = (size: PlotSize) => {
  switch (size) {
    case PlotSize.LARGE:
      return 2
    case PlotSize.SMALL:
      return 4
    case PlotSize.REGULAR:
    default:
      return 3
  }
}

export const getNbItemsPerRow = (size: PlotSize) => {
  const { innerWidth } = window
  if (innerWidth >= 2000) {
    return Math.floor(innerWidth / maxPlotSize[size])
  }

  if (innerWidth >= 1600) {
    return getNbItemsPerRow1600w(size)
  }

  if (innerWidth >= 800) {
    return getNbItemsPerRow800w(size)
  }

  if (size === PlotSize.SMALL && innerWidth >= 600) {
    return 2
  }

  return 1
}
