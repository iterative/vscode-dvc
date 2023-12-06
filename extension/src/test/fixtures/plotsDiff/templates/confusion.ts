import type { TopLevelSpec } from 'vega-lite'
import { PLOT_ANCHORS } from '../../../../cli/dvc/contract'

const data = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  data: {
    values: PLOT_ANCHORS.DATA
  },
  title: PLOT_ANCHORS.TITLE,
  facet: {
    column: {
      field: 'rev',
      sort: []
    },
    row: '<DVC_METRIC_ROW>'
  },
  params: [
    {
      name: 'showValues',
      bind: {
        input: 'checkbox'
      }
    }
  ],
  spec: {
    transform: [
      {
        aggregate: [
          {
            op: 'count',
            as: 'xy_count'
          }
        ],
        groupby: [PLOT_ANCHORS.Y, PLOT_ANCHORS.X]
      },
      {
        impute: 'xy_count',
        groupby: '<DVC_METRIC_GROUP_BY_Y>',
        key: PLOT_ANCHORS.X,
        value: 0
      },
      {
        impute: 'xy_count',
        groupby: '<DVC_METRIC_GROUP_BY_X>',
        key: PLOT_ANCHORS.Y,
        value: 0
      },
      {
        joinaggregate: [
          {
            op: 'max',
            field: 'xy_count',
            as: 'max_count'
          }
        ],
        groupby: []
      },
      {
        calculate: 'datum.xy_count / datum.max_count',
        as: 'percent_of_max'
      }
    ],
    encoding: {
      x: {
        field: PLOT_ANCHORS.X,
        type: 'nominal',
        sort: 'ascending',
        title: PLOT_ANCHORS.X_LABEL
      },
      y: {
        field: PLOT_ANCHORS.Y,
        type: 'nominal',
        sort: 'ascending',
        title: PLOT_ANCHORS.Y_LABEL
      }
    },
    layer: [
      {
        mark: 'rect',
        width: PLOT_ANCHORS.WIDTH,
        height: PLOT_ANCHORS.HEIGHT,
        encoding: {
          color: {
            field: 'xy_count',
            type: 'quantitative',
            title: '',
            scale: {
              domainMin: 0,
              nice: true
            }
          }
        }
      },
      {
        selection: {
          label: {
            type: 'single',
            on: 'mouseover',
            encodings: ['x', 'y'],
            empty: 'none',
            clear: 'mouseout'
          }
        },
        mark: 'rect',
        encoding: {
          tooltip: [
            {
              field: PLOT_ANCHORS.X,
              type: 'nominal'
            },
            {
              field: PLOT_ANCHORS.Y,
              type: 'nominal'
            },
            {
              field: 'xy_count',
              type: 'quantitative'
            }
          ],
          opacity: {
            condition: {
              selection: 'label',
              value: 1
            },
            value: 0
          }
        }
      },
      {
        transform: [
          {
            filter: {
              selection: 'label'
            }
          }
        ],
        layer: [
          {
            mark: {
              type: 'rect',
              color: 'lightpink'
            }
          }
        ]
      },
      {
        mark: 'text',
        encoding: {
          text: {
            condition: {
              param: 'showValues',
              field: 'xy_count',
              type: 'quantitative'
            }
          },
          color: {
            condition: {
              test: 'datum.percent_of_max > 0.5',
              value: 'white'
            },
            value: 'black'
          }
        }
      }
    ]
  }
} as TopLevelSpec

export default data
