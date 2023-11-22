import { TopLevelSpec } from 'vega-lite'
import {
  PLOT_DATA_ANCHOR,
  PLOT_TITLE_ANCHOR,
  PLOT_X_ANCHOR,
  PLOT_X_LABEL_ANCHOR,
  PLOT_Y_ANCHOR,
  PLOT_Y_LABEL_ANCHOR
} from '../../../../cli/dvc/contract'

const data = {
  $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
  data: {
    values: PLOT_DATA_ANCHOR
  },
  title: PLOT_TITLE_ANCHOR,
  facet: {
    field: 'rev',
    type: 'nominal'
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
        groupby: [PLOT_Y_ANCHOR, PLOT_X_ANCHOR]
      },
      {
        impute: 'xy_count',
        groupby: ['rev', PLOT_Y_ANCHOR],
        key: PLOT_X_ANCHOR,
        value: 0
      },
      {
        impute: 'xy_count',
        groupby: ['rev', PLOT_X_ANCHOR],
        key: PLOT_Y_ANCHOR,
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
        groupby: [PLOT_Y_ANCHOR]
      },
      {
        calculate: 'datum.xy_count / datum.sum_y',
        as: 'percent_of_y'
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
        width: 300,
        height: 300,
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
        mark: 'text',
        encoding: {
          text: {
            field: 'percent_of_y',
            type: 'quantitative',
            format: '.2f'
          },
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
