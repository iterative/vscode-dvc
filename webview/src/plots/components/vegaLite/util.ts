import { AnchorDefinitions } from 'dvc/src/cli/dvc/contract'
import { DEFAULT_NB_ITEMS_PER_ROW } from 'dvc/src/plots/webview/contract'
import { VisualizationSpec } from 'react-vega'
import { truncate } from 'vega-util'

export const fillTemplate = (
  plot:
    | {
        content: string
        anchor_definitions: AnchorDefinitions
      }
    | undefined,
  nbItemsPerRow: number,
  height: number,
  plotFocused: boolean
  // eslint-disable-next-line sonarjs/cognitive-complexity
): VisualizationSpec | undefined => {
  if (!plot) {
    return
  }

  const { content, anchor_definitions } = plot

  const width = nbItemsPerRow > DEFAULT_NB_ITEMS_PER_ROW ? 30 : 50
  let specStr = content

  for (const [key, value] of Object.entries(anchor_definitions)) {
    if (['<DVC_METRIC_TITLE>', '<DVC_METRIC_X_LABEL>'].includes(key)) {
      const truncatedValue = truncate(value, width, 'left')
      specStr = specStr.replace(new RegExp(key, 'g'), truncatedValue)
      continue
    }

    if (key === '<DVC_METRIC_Y_LABEL>') {
      const truncatedVerticalValue = truncate(
        value,
        Math.floor((50 - (nbItemsPerRow - height) * 5) * 0.75),
        'left'
      )
      specStr = specStr.replace(new RegExp(key, 'g'), truncatedVerticalValue)
      continue
    }

    if (key === '<DVC_METRIC_ZOOM_AND_PAN>') {
      const suppressZoomAndPan = !plotFocused
      specStr = specStr.replace(
        new RegExp(`"${key}"`, 'g'),
        suppressZoomAndPan ? '' : value
      )
      continue
    }

    if (
      [
        '<DVC_METRIC_COLOR>',
        '<DVC_METRIC_SHAPE>',
        '<DVC_METRIC_STROKE_DASH>'
      ].includes(key)
    ) {
      const suppressLegend = !plotFocused
      if (suppressLegend) {
        const obj = JSON.parse(value) as { [key: string]: unknown }
        obj.legend = null
        specStr = specStr.replace(
          new RegExp(`"${key}"`, 'g'),
          JSON.stringify(obj)
        )
      } else {
        specStr = specStr.replace(new RegExp(`"${key}"`, 'g'), value)
      }
      continue
    }

    if (['<DVC_PARAM_TYPE>', '<DVC_METRIC_TYPE>'].includes(key)) {
      specStr = specStr.replace(new RegExp(key, 'g'), value)
      continue
    }

    if (['<DVC_METRIC_PLOT_HEIGHT>', '<DVC_METRIC_PLOT_WIDTH>'].includes(key)) {
      specStr = specStr.replace(new RegExp(key, 'g'), 'container')
      continue
    }

    if (
      ['<DVC_METRIC_COLUMN_WIDTH>', '<DVC_METRIC_ROW_HEIGHT>'].includes(key)
    ) {
      specStr = specStr.replace(new RegExp(`"${key}"`, 'g'), '300')
      continue
    }

    specStr = specStr.replace(new RegExp(`"${key}"`, 'g'), value)
  }

  return JSON.parse(specStr) as VisualizationSpec
}
