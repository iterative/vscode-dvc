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
    type: 'bar'
  },
  params: [PLOT_ANCHORS.ZOOM_AND_PAN],
  encoding: {
    x: {
      field: PLOT_ANCHORS.X,
      type: 'quantitative',
      title: PLOT_ANCHORS.X_LABEL,
      scale: {
        zero: false
      }
    },
    y: {
      field: PLOT_ANCHORS.Y,
      type: 'nominal',
      title: PLOT_ANCHORS.Y_LABEL
    },
    yOffset: {
      field: 'rev',
      sort: []
    },
    color: PLOT_ANCHORS.COLOR,
    column: PLOT_ANCHORS.COLUMN
  }
} as unknown as TopLevelSpec

export default data
