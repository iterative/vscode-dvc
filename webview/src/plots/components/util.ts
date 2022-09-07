import { PlotSize } from 'dvc/src/plots/webview/contract'
import { ExprRef, hasOwnProperty, SignalRef, Title, truncate, Text } from 'vega'
import { TitleParams } from 'vega-lite/build/src/title'

const MaxItemsBeforeVirtualization = {
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

export const shouldUseVirtualizedGrid = (nbItems: number, size: PlotSize) =>
  nbItems > MaxItemsBeforeVirtualization[size]

const truncateTitlePart = (title: string, size: number) =>
  truncate(title, size, 'left')

const truncateTitleAsArrayOrString = (title: Text, size: number) => {
  if (Array.isArray(title)) {
    return title.map(line => truncateTitlePart(line, size))
  }
  return truncateTitlePart(title as unknown as string, size)
}

export const truncateTitle = (
  title: Title | Text | TitleParams<ExprRef | SignalRef> | undefined,
  size: number
) => {
  if (!title) {
    return ''
  }

  if (typeof title === 'string') {
    return truncateTitlePart(title, size)
  }

  if (Array.isArray(title)) {
    return truncateTitleAsArrayOrString(title as Text, size)
  }

  const titleCopy = { ...title } as Title

  if (hasOwnProperty(titleCopy, 'text')) {
    const text = titleCopy.text as unknown as Text
    titleCopy.text = truncateTitleAsArrayOrString(text, size)
  }

  if (hasOwnProperty(title, 'subtitle')) {
    const subtitle = titleCopy.subtitle as unknown as Text
    titleCopy.subtitle = truncateTitleAsArrayOrString(subtitle, size)
  }
  return titleCopy
}
