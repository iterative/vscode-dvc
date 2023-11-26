import type { TopLevelSpec } from 'vega-lite'
import {
  PLOT_COLOR_ANCHOR,
  PLOT_DATA_ANCHOR,
  PLOT_HEIGHT_ANCHOR,
  PLOT_STROKE_DASH_ANCHOR,
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
  params: [
    {
      name: 'smooth',
      value: 0.001,
      bind: {
        input: 'range',
        min: 0.001,
        max: 1,
        step: 0.001
      }
    }
  ],
  encoding: {
    x: {
      field: PLOT_X_ANCHOR,
      type: 'quantitative',
      title: PLOT_X_LABEL_ANCHOR
    },
    color: PLOT_COLOR_ANCHOR,
    strokeDash: PLOT_STROKE_DASH_ANCHOR
  },
  layer: [
    {
      layer: [
        {
          params: [PLOT_ZOOM_AND_PAN_ANCHOR],
          mark: 'line'
        },
        {
          transform: [
            {
              filter: {
                param: 'hover',
                empty: false
              }
            }
          ],
          mark: 'point'
        }
      ],
      encoding: {
        y: {
          field: PLOT_Y_ANCHOR,
          type: 'quantitative',
          title: PLOT_Y_LABEL_ANCHOR,
          scale: {
            zero: false
          }
        },
        color: {
          field: 'rev',
          type: 'nominal'
        }
      },
      transform: [
        {
          loess: PLOT_Y_ANCHOR,
          on: PLOT_X_ANCHOR,
          groupby: '<DVC_METRIC_GROUP_BY>',
          bandwidth: {
            signal: 'smooth'
          }
        }
      ]
    },
    {
      mark: {
        type: 'line',
        opacity: 0.2
      },
      encoding: {
        x: {
          field: PLOT_X_ANCHOR,
          type: 'quantitative',
          title: PLOT_X_LABEL_ANCHOR
        },
        y: {
          field: PLOT_Y_ANCHOR,
          type: 'quantitative',
          title: PLOT_Y_LABEL_ANCHOR,
          scale: {
            zero: false
          }
        },
        color: {
          field: 'rev',
          type: 'nominal'
        }
      }
    },
    {
      mark: {
        type: 'circle',
        size: 10
      },
      encoding: {
        x: {
          aggregate: 'max',
          field: PLOT_X_ANCHOR,
          type: 'quantitative',
          title: PLOT_X_LABEL_ANCHOR
        },
        y: {
          aggregate: {
            argmax: PLOT_X_ANCHOR
          },
          field: PLOT_Y_ANCHOR,
          type: 'quantitative',
          title: PLOT_Y_LABEL_ANCHOR,
          scale: {
            zero: false
          }
        },
        color: {
          field: 'rev',
          type: 'nominal'
        }
      }
    },
    {
      transform: [
        {
          calculate: '<DVC_METRIC_PIVOT_FIELD>',
          as: 'pivot_field'
        },
        {
          pivot: 'pivot_field',
          value: PLOT_Y_ANCHOR,
          groupby: [PLOT_X_ANCHOR]
        }
      ],
      mark: {
        type: 'rule',
        tooltip: {
          content: 'data'
        },
        stroke: 'grey'
      },
      encoding: {
        opacity: {
          condition: {
            value: 0.3,
            param: 'hover',
            empty: false
          },
          value: 0
        }
      },
      params: [
        {
          name: 'hover',
          select: {
            type: 'point',
            fields: [PLOT_X_ANCHOR],
            nearest: true,
            on: 'mouseover',
            clear: 'mouseout'
          }
        }
      ]
    }
  ]
} as unknown as TopLevelSpec

export default data
