import { TopLevelSpec } from 'vega-lite'
import {
  PLOT_DATA_ANCHOR,
  PLOT_HEIGHT_ANCHOR,
  PLOT_TITLE_ANCHOR,
  PLOT_WIDTH_ANCHOR,
  PLOT_X_ANCHOR,
  PLOT_X_LABEL_ANCHOR,
  PLOT_Y_ANCHOR,
  PLOT_Y_LABEL_ANCHOR
} from '../../../../cli/dvc/contract'

const data = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  data: {
    values: PLOT_DATA_ANCHOR
  },
  title: PLOT_TITLE_ANCHOR,
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
        groupby: [PLOT_Y_ANCHOR, PLOT_X_ANCHOR]
      },
      {
        impute: 'xy_count',
        groupby: '<DVC_METRIC_GROUP_BY_Y>',
        key: PLOT_X_ANCHOR,
        value: 0
      },
      {
        impute: 'xy_count',
        groupby: '<DVC_METRIC_GROUP_BY_X>',
        key: PLOT_Y_ANCHOR,
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
        field: PLOT_X_ANCHOR,
        type: 'nominal',
        sort: 'ascending',
        title: PLOT_X_LABEL_ANCHOR
      },
      y: {
        field: PLOT_Y_ANCHOR,
        type: 'nominal',
        sort: 'ascending',
        title: PLOT_Y_LABEL_ANCHOR
      }
    },
    layer: [
      {
        mark: 'rect',
        width: PLOT_WIDTH_ANCHOR,
        height: PLOT_HEIGHT_ANCHOR,
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
              field: PLOT_X_ANCHOR,
              type: 'nominal'
            },
            {
              field: PLOT_Y_ANCHOR,
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
