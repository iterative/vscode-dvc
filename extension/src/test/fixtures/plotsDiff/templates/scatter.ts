import type { TopLevelSpec } from 'vega-lite'
import { PLOT_ANCHORS } from '../../../../cli/dvc/contract'

const data = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  data: {
    values: PLOT_ANCHORS.DATA
  },
  title: PLOT_ANCHORS.TITLE,
  width: PLOT_ANCHORS.WIDTH,
  height: PLOT_ANCHORS.HEIGHT,
  mark: {
    type: 'point',
    tooltip: {
      content: 'data'
    }
  },
  params: [PLOT_ANCHORS.ZOOM_AND_PAN],
  encoding: {
    x: {
      field: PLOT_ANCHORS.X,
      type: 'quantitative',
      title: PLOT_ANCHORS.X_LABEL
    },
    y: {
      field: PLOT_ANCHORS.Y,
      type: 'quantitative',
      title: PLOT_ANCHORS.Y_LABEL
    },
    color: PLOT_ANCHORS.COLOR,
    shape: PLOT_ANCHORS.SHAPE,
    tooltip: '<DVC_METRIC_TOOLTIP>'
  }
} as unknown as TopLevelSpec

export default data
