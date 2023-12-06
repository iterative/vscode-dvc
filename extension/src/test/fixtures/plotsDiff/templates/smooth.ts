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
      field: PLOT_ANCHORS.X,
      type: 'quantitative',
      title: PLOT_ANCHORS.X_LABEL
    },
    color: PLOT_ANCHORS.COLOR,
    strokeDash: PLOT_ANCHORS.STROKE_DASH
  },
  layer: [
    {
      layer: [
        {
          params: [PLOT_ANCHORS.ZOOM_AND_PAN],
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
          field: PLOT_ANCHORS.Y,
          type: 'quantitative',
          title: PLOT_ANCHORS.Y_LABEL,
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
          loess: PLOT_ANCHORS.Y,
          on: PLOT_ANCHORS.X,
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
          field: PLOT_ANCHORS.X,
          type: 'quantitative',
          title: PLOT_ANCHORS.X_LABEL
        },
        y: {
          field: PLOT_ANCHORS.Y,
          type: 'quantitative',
          title: PLOT_ANCHORS.Y_LABEL,
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
          field: PLOT_ANCHORS.X,
          type: 'quantitative',
          title: PLOT_ANCHORS.X_LABEL
        },
        y: {
          aggregate: {
            argmax: PLOT_ANCHORS.X
          },
          field: PLOT_ANCHORS.Y,
          type: 'quantitative',
          title: PLOT_ANCHORS.Y_LABEL,
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
          value: PLOT_ANCHORS.Y,
          groupby: [PLOT_ANCHORS.X]
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
            fields: [PLOT_ANCHORS.X],
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
