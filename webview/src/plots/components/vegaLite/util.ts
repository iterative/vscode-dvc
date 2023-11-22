import { TopLevelSpec } from 'vega-lite'
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

// come back to the width of titles
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
  // eslint-disable-next-line sonarjs/cognitive-complexity
): TopLevelSpec | undefined => {
  if (!plot) {
    return
  }

  const { content, anchorDefinitions } = plot

  const updatedAnchors: Record<string, unknown> = {}

  const width = nbItemsPerRow > DEFAULT_NB_ITEMS_PER_ROW ? 30 : 50

  for (const [key, value] of Object.entries(anchorDefinitions)) {
    if (key === PLOT_TITLE_ANCHOR || key === PLOT_X_LABEL_ANCHOR) {
      const strValue = String(value)
      updatedAnchors[key] = plotFocused
        ? strValue
        : truncate(strValue, width, 'left')
    }

    if (key === PLOT_Y_LABEL_ANCHOR) {
      updatedAnchors[key] = truncate(
        value as string,
        Math.floor((50 - (nbItemsPerRow - height) * 5) * 0.75),
        'left'
      )
    }

    if (
      !plotFocused &&
      (key === PLOT_COLOR_ANCHOR ||
        key === PLOT_SHAPE_ANCHOR ||
        key === PLOT_STROKE_DASH_ANCHOR)
    ) {
      updatedAnchors[key] = {
        ...(value as AnchorDefinitions[typeof PLOT_COLOR_ANCHOR]),
        legend: null
      }
    }
  }

  updatedAnchors[PLOT_ZOOM_AND_PAN_ANCHOR] = plotFocused
    ? ZOOM_AND_PAN_PROP
    : {}

  const isMultiView = isMultiViewPlot(content, anchorDefinitions)

  updatedAnchors[PLOT_HEIGHT_ANCHOR] = isMultiView ? 300 : 'container'

  updatedAnchors[PLOT_WIDTH_ANCHOR] = isMultiView ? 300 : 'container'

  return replaceAnchors(content, {
    ...anchorDefinitions,
    ...updatedAnchors
  }) as TopLevelSpec
}
