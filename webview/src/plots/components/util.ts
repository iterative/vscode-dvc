import { PlotSize } from 'dvc/src/plots/webview/contract'

export const MaxItemsBeforeVirtualization = {
  [PlotSize.LARGE]: 10,
  [PlotSize.REGULAR]: 15,
  [PlotSize.SMALL]: 20
}

const maxPlotSize = {
  [PlotSize.LARGE]: 1000,
  [PlotSize.REGULAR]: 800,
  [PlotSize.SMALL]: 500
}

export const DEFAULT_NB_ITEMS_PER_ROW = 4

const w1600NbItemsPerRow = {
  [PlotSize.LARGE]: 3,
  [PlotSize.REGULAR]: 4,
  [PlotSize.SMALL]: 6
}
const w800NbItemsPerRow = {
  [PlotSize.LARGE]: 2,
  [PlotSize.REGULAR]: 3,
  [PlotSize.SMALL]: 4
}

export const getNbItemsPerRow = (size: PlotSize) => {
  const { innerWidth } = window
  if (innerWidth >= 2000) {
    return Math.floor(innerWidth / maxPlotSize[size])
  }

  if (innerWidth >= 1600) {
    return w1600NbItemsPerRow[size]
  }

  if (innerWidth >= 800) {
    return w800NbItemsPerRow[size]
  }

  return size === PlotSize.SMALL && innerWidth >= 600 ? 2 : 1
}
