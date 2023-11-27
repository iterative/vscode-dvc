import type { TopLevelSpec } from 'vega-lite'
import {
  AnchorDefinitions,
  PLOT_COLOR_ANCHOR,
  PLOT_HEIGHT_ANCHOR,
  PLOT_WIDTH_ANCHOR,
  PLOT_SHAPE_ANCHOR,
  PLOT_STROKE_DASH_ANCHOR,
  PLOT_TITLE_ANCHOR,
  PLOT_X_LABEL_ANCHOR,
  PLOT_Y_LABEL_ANCHOR,
  PLOT_ZOOM_AND_PAN_ANCHOR,
  ZOOM_AND_PAN_PROP
} from 'dvc/src/cli/dvc/contract'
import { DEFAULT_NB_ITEMS_PER_ROW } from 'dvc/src/plots/webview/contract'
import { isMultiViewPlot } from 'dvc/src/plots/vega/util'
import { truncate } from 'vega-util'

const isAnchor = (
  value: unknown,
  anchorDefinitions: AnchorDefinitions
): value is keyof AnchorDefinitions =>
  typeof value === 'string' && value in anchorDefinitions

const replaceAnchors = (
  value: unknown,
  anchorDefinitions: AnchorDefinitions
  // eslint-disable-next-line sonarjs/cognitive-complexity
): unknown => {
  if (!value) {
    return value
  }

  if (isAnchor(value, anchorDefinitions)) {
    return anchorDefinitions[value]
  }

  if (value && typeof value === 'object') {
    if (Array.isArray(value)) {
      const updatedArray = []
      for (const item of value) {
        updatedArray.push(replaceAnchors(item, anchorDefinitions))
      }
      return updatedArray
    }

    const updatedObject: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) {
      updatedObject[key] = replaceAnchors(item, anchorDefinitions)
    }
    return updatedObject
  }

  return value
}

const getMaxHorizontalTitleCharacters = (nbItemsPerRow: number): number => {
  if (nbItemsPerRow === 1) {
    return 80
  }
  if (nbItemsPerRow === DEFAULT_NB_ITEMS_PER_ROW) {
    return 50
  }
  return 30
}

const getMaxVerticalTitleCharacters = (
  nbItemsPerRow: number,
  height: number,
  plotFocused: boolean
) => {
  if (plotFocused) {
    return 60
  }
  return Math.floor((50 - (nbItemsPerRow - height) * 5) * 0.75)
}

const updateTitles = (
  updatedAnchors: Record<string, unknown>,
  key: string,
  value: unknown,
  titleWidth: number,
  titleHeight: number
) => {
  if (
    key !== PLOT_TITLE_ANCHOR &&
    key !== PLOT_X_LABEL_ANCHOR &&
    key !== PLOT_Y_LABEL_ANCHOR
  ) {
    return
  }

  const length = key === PLOT_Y_LABEL_ANCHOR ? titleHeight : titleWidth
  updatedAnchors[key] = truncate(value as string, length, 'left')
}
const updateLegend = (
  updatedAnchors: Record<string, unknown>,
  plotFocused: boolean,
  key: string,
  value: unknown
) => {
  if (
    plotFocused ||
    (key !== PLOT_COLOR_ANCHOR &&
      key !== PLOT_SHAPE_ANCHOR &&
      key !== PLOT_STROKE_DASH_ANCHOR)
  ) {
    return
  }

  updatedAnchors[key] = {
    ...(value as AnchorDefinitions[
      | typeof PLOT_COLOR_ANCHOR
      | typeof PLOT_SHAPE_ANCHOR
      | typeof PLOT_STROKE_DASH_ANCHOR]),
    legend: null
  }
}

const getUpdatedAnchors = (
  anchorDefinitions: AnchorDefinitions,
  nbItemsPerRow: number,
  height: number,
  plotFocused: boolean,
  isMultiView: boolean
): Record<string, unknown> => {
  const updatedAnchors: Record<string, unknown> = {}
  const titleWidth = getMaxHorizontalTitleCharacters(nbItemsPerRow)
  const titleHeight = getMaxVerticalTitleCharacters(
    nbItemsPerRow,
    height,
    plotFocused
  )

  for (const [key, value] of Object.entries(anchorDefinitions)) {
    updateTitles(updatedAnchors, key, value, titleWidth, titleHeight)
    updateLegend(updatedAnchors, plotFocused, key, value)
  }
  updatedAnchors[PLOT_ZOOM_AND_PAN_ANCHOR] = plotFocused
    ? ZOOM_AND_PAN_PROP
    : {}

  updatedAnchors[PLOT_HEIGHT_ANCHOR] = isMultiView ? 300 : 'container'

  updatedAnchors[PLOT_WIDTH_ANCHOR] = isMultiView ? 300 : 'container'

  return updatedAnchors
}

export const fillTemplate = (
  plot:
    | {
        content: TopLevelSpec
        anchorDefinitions: AnchorDefinitions
      }
    | undefined,
  nbItemsPerRow: number,
  height: number,
  plotFocused: boolean
): TopLevelSpec | undefined => {
  if (!plot) {
    return
  }

  const { content, anchorDefinitions } = plot

  const isMultiView = isMultiViewPlot(content, anchorDefinitions)

  const updatedAnchors = getUpdatedAnchors(
    anchorDefinitions,
    nbItemsPerRow,
    height,
    plotFocused,
    isMultiView
  )

  return replaceAnchors(content, {
    ...anchorDefinitions,
    ...updatedAnchors
  }) as TopLevelSpec
}
