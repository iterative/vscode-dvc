import { VegaLiteProps } from 'react-vega/lib/VegaLite'
import { AnchorDefinitions } from 'dvc/src/cli/dvc/contract'
import { DEFAULT_NB_ITEMS_PER_ROW } from 'dvc/src/plots/webview/contract'
import { VisualizationSpec } from 'react-vega'
import { truncate } from 'vega-util'
import { config } from '../components/constants'

export const getVegaLiteProps = (
  id: string,
  spec: VisualizationSpec | undefined,
  actions:
    | false
    | {
        compiled: false
        editor: false
        export: true
        source: false
      }
) =>
  ({
    actions,
    config,
    'data-testid': `${id}-vega`,
    renderer: 'svg',
    spec: spec || {}
  }) as VegaLiteProps

export const fillTemplate = (
  plot:
    | {
        content: string
        anchor_definitions: AnchorDefinitions
      }
    | undefined,
  nbItemsPerRow: number,
  height: number,
  suppressLegend: boolean
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
    }

    if (key === '<DVC_METRIC_Y_LABEL>') {
      const truncatedVerticalValue = truncate(
        value,
        Math.floor((50 - (nbItemsPerRow - height) * 5) * 0.75),
        'left'
      )
      specStr = specStr.replace(new RegExp(key, 'g'), truncatedVerticalValue)
    }

    if (
      [
        '<DVC_METRIC_COLOR>',
        '<DVC_METRIC_SHAPE>',
        '<DVC_METRIC_STROKE_DASH>'
      ].includes(key)
    ) {
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
    }

    if (key === '<DVC_METRIC_DATA>') {
      specStr = specStr.replace(`"${key}"`, value)
    }

    if (['<DVC_PARAM_TYPE>', '<DVC_METRIC_TYPE>'].includes(key)) {
      specStr = specStr.replace(key, value)
    }
  }

  const spec = JSON.parse(specStr) as { [key: string]: unknown }
  spec.width = 'container'
  spec.height = 'container'
  return spec as VisualizationSpec
}
