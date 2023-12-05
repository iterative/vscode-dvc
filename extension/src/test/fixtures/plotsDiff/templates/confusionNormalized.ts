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
        groupby: ['rev', PLOT_ANCHORS.Y],
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
            op: 'sum',
            field: 'xy_count',
            as: 'sum_y'
          }
        ],
        groupby: [PLOT_ANCHORS.Y]
      },
      {
        calculate: 'datum.xy_count / datum.sum_y',
        as: 'percent_of_y'
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
            field: 'percent_of_y',
            type: 'quantitative',
            title: '',
            scale: {
              domain: [0, 1]
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
              field: 'percent_of_y',
              type: 'quantitative',
              format: '.2f'
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
          color: {
            condition: {
              test: 'datum.percent_of_y > 0.5',
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
