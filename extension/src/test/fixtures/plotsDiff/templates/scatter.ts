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
  width: 300,
  height: 300,
  layer: [
    {
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
      },
      layer: [
        {
          mark: 'point'
        },
        {
          selection: {
            label: {
              type: 'single',
              nearest: true,
              on: 'mouseover',
              encodings: ['x'],
              empty: 'none',
              clear: 'mouseout'
            }
          },
          mark: 'point',
          encoding: {
            opacity: {
              condition: {
                selection: 'label',
                value: 1
              },
              value: 0
            }
          }
        }
      ]
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
          encoding: {
            text: {
              type: 'quantitative',
              field: PLOT_Y_ANCHOR
            },
            x: {
              field: PLOT_X_ANCHOR,
              type: 'quantitative'
            },
            y: {
              field: PLOT_Y_ANCHOR,
              type: 'quantitative'
            }
          },
          layer: [
            {
              mark: {
                type: 'text',
                align: 'left',
                dx: 5,
                dy: -5
              },
              encoding: {
                color: {
                  type: 'nominal',
                  field: 'rev'
                }
              }
            }
          ]
        }
      ]
    }
  ]
} as TopLevelSpec

export default data
