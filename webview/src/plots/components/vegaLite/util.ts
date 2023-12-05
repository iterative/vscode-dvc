import type { TopLevelSpec } from 'vega-lite'
import {
  AnchorDefinitions,
  PLOT_ANCHORS,
  ZOOM_AND_PAN_PROP
} from 'dvc/src/cli/dvc/contract'
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

const updateTitles = (
  updatedAnchors: Record<string, unknown>,
  key: keyof AnchorDefinitions,
  value: unknown,
  titleWidth: number,
  titleHeight: number
) => {
  if (
    key !== PLOT_ANCHORS.TITLE &&
    key !== PLOT_ANCHORS.X_LABEL &&
    key !== PLOT_ANCHORS.Y_LABEL
  ) {
    return
  }

  const length = key === PLOT_ANCHORS.Y_LABEL ? titleHeight : titleWidth
  updatedAnchors[key] = truncate(value as string, length, 'left')
}

const updateLegend = (
  updatedAnchors: Record<string, unknown>,
  plotFocused: boolean,
  key: PLOT_ANCHORS,
  value: unknown
) => {
  if (
    plotFocused ||
    (key !== PLOT_ANCHORS.COLOR &&
      key !== PLOT_ANCHORS.SHAPE &&
      key !== PLOT_ANCHORS.STROKE_DASH)
  ) {
    return
  }

  updatedAnchors[key] = {
    ...(value as AnchorDefinitions[
      | typeof PLOT_ANCHORS.COLOR
      | typeof PLOT_ANCHORS.SHAPE
      | typeof PLOT_ANCHORS.STROKE_DASH]),
    legend: null
  }
}

const getUpdatedAnchors = (
  anchorDefinitions: AnchorDefinitions,
  width: number,
  height: number,
  plotFocused: boolean,
  isMultiView: boolean
): Record<string, unknown> => {
  const updatedAnchors: Record<string, unknown> = {}
  const maxHorizontalTitleChars = width / 10
  const maxVerticalTitleChars = height / 10

  for (const [key, value] of Object.entries(anchorDefinitions)) {
    const tKey = key as keyof AnchorDefinitions
    updateTitles(
      updatedAnchors,
      tKey,
      value,
      maxHorizontalTitleChars,
      maxVerticalTitleChars
    )
    updateLegend(updatedAnchors, plotFocused, tKey, value)
  }
  updatedAnchors[PLOT_ANCHORS.ZOOM_AND_PAN] = plotFocused
    ? ZOOM_AND_PAN_PROP
    : {}

  updatedAnchors[PLOT_ANCHORS.HEIGHT] = isMultiView ? 300 : 'container'

  updatedAnchors[PLOT_ANCHORS.WIDTH] = isMultiView ? 300 : 'container'

  return updatedAnchors
}

export const fillTemplate = (
  plot:
    | {
        content: TopLevelSpec
        anchorDefinitions: AnchorDefinitions
      }
    | undefined,
  width: number,
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
    width,
    height,
    plotFocused,
    isMultiView
  )

  return replaceAnchors(content, {
    ...anchorDefinitions,
    ...updatedAnchors
  }) as TopLevelSpec
}
