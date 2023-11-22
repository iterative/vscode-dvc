import { TopLevelSpec } from 'vega-lite'
import {
  PLOT_COLOR_ANCHOR,
  PLOT_COLUMN_ANCHOR,
  PLOT_DATA_ANCHOR,
  PLOT_HEIGHT_ANCHOR,
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
    type: 'bar'
  },
  params: [PLOT_ZOOM_AND_PAN_ANCHOR],
  encoding: {
    x: {
      field: PLOT_X_ANCHOR,
      type: 'quantitative',
      title: PLOT_X_LABEL_ANCHOR,
      scale: {
        zero: false
      }
    },
    y: {
      field: PLOT_Y_ANCHOR,
      type: 'nominal',
      title: PLOT_Y_LABEL_ANCHOR
    },
    yOffset: {
      field: 'rev',
      sort: []
    },
    color: PLOT_COLOR_ANCHOR,
    column: PLOT_COLUMN_ANCHOR
  }
} as unknown as TopLevelSpec

export default data
