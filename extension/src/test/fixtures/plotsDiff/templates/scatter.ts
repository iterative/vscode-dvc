import { TopLevelSpec } from 'vega-lite'
import {
  PLOT_COLOR_ANCHOR,
  PLOT_DATA_ANCHOR,
  PLOT_HEIGHT_ANCHOR,
  PLOT_SHAPE_ANCHOR,
  PLOT_TITLE_ANCHOR,
  PLOT_WIDTH_ANCHOR,
  PLOT_X_ANCHOR,
  PLOT_X_LABEL_ANCHOR,
  PLOT_Y_ANCHOR,
  PLOT_Y_LABEL_ANCHOR,
  PLOT_ZOOM_AND_PAN_ANCHOR
} from '../../../../cli/dvc/contract'

const data = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  data: {
    values: PLOT_DATA_ANCHOR
  },
  title: PLOT_TITLE_ANCHOR,
  width: PLOT_WIDTH_ANCHOR,
  height: PLOT_HEIGHT_ANCHOR,
  mark: {
    type: 'point',
    tooltip: {
      content: 'data'
    }
  },
  params: [PLOT_ZOOM_AND_PAN_ANCHOR],
  encoding: {
    x: {
      field: PLOT_X_ANCHOR,
      type: 'quantitative',
      title: PLOT_X_LABEL_ANCHOR
    },
    y: {
      field: PLOT_Y_ANCHOR,
      type: 'quantitative',
      title: PLOT_Y_LABEL_ANCHOR
    },
    color: PLOT_COLOR_ANCHOR,
    shape: PLOT_SHAPE_ANCHOR,
    tooltip: '<DVC_METRIC_TOOLTIP>'
  }
} as unknown as TopLevelSpec

export default data
