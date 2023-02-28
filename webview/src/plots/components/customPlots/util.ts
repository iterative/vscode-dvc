import { VisualizationSpec } from 'react-vega'

export const createSpec = (metric: string, param: string) =>
  ({
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { name: 'values' },
    encoding: {
      x: {
        field: 'param',
        title: param,
        type: 'quantitative'
      },
      y: {
        field: 'metric',
        scale: { zero: false },
        title: metric,
        type: 'quantitative'
      }
    },
    height: 'container',
    layer: [
      {
        layer: [
          {
            mark: {
              type: 'line'
            }
          },
          {
            mark: {
              type: 'point'
            },
            transform: [
              {
                filter: {
                  param: 'hover'
                }
              }
            ]
          }
        ]
      },
      {
        encoding: {
          opacity: {
            value: 0
          },
          tooltip: [
            {
              field: 'expName',
              title: 'name'
            },
            {
              field: 'metric',
              title: metric
            },
            {
              field: 'param',
              title: param
            }
          ]
        },
        mark: {
          type: 'rule'
        },
        params: [
          {
            name: 'hover',
            select: {
              clear: 'mouseout',
              fields: ['param', 'metric'],
              nearest: true,
              on: 'mouseover',
              type: 'point'
            }
          }
        ]
      }
    ],
    transform: [
      {
        as: 'y',
        calculate: "format(datum['y'],'.5f')"
      }
    ],
    width: 'container'
  } as VisualizationSpec)
