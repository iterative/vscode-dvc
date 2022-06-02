import { VisualizationSpec } from 'react-vega'
import { ColorScale } from 'dvc/src/plots/webview/contract'

export const createSpec = (
  title: string,
  scale?: ColorScale
): VisualizationSpec =>
  ({
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { name: 'values' },
    encoding: {
      color: {
        field: 'group',
        legend: { disable: true },
        scale,
        title: 'rev',
        type: 'nominal'
      },
      x: {
        axis: { format: '0d', tickMinStep: 1 },
        field: 'iteration',
        title: 'iteration',
        type: 'quantitative'
      },
      y: {
        field: 'y',
        scale: { zero: false },
        title,
        type: 'quantitative'
      }
    },
    height: 'container',
    layer: [
      {
        layer: [
          { mark: { type: 'line' } },
          {
            mark: { type: 'point' },
            transform: [
              {
                filter: { empty: false, param: 'hover' }
              }
            ]
          }
        ]
      },
      {
        encoding: {
          opacity: { value: 0 },
          tooltip: [
            { field: 'group', title: 'name' },
            {
              field: 'y',
              title: title.slice(Math.max(0, title.indexOf(':') + 1)),
              type: 'quantitative'
            }
          ]
        },
        mark: { type: 'rule' },
        params: [
          {
            name: 'hover',
            select: {
              clear: 'mouseout',
              fields: ['iteration', 'y'],
              nearest: true,
              on: 'mouseover',
              type: 'point'
            }
          }
        ]
      },
      {
        encoding: {
          color: { field: 'group', scale },
          x: { aggregate: 'max', field: 'iteration', type: 'quantitative' },
          y: {
            aggregate: { argmax: 'iteration' },
            field: 'y',
            type: 'quantitative'
          }
        },
        mark: { stroke: null, type: 'circle' }
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
