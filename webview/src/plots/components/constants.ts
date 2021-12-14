import { LivePlotsColors } from 'dvc/src/plots/webview/contract'
import { Config } from 'vega'
import { VisualizationSpec } from 'react-vega'

export const createSpec = (
  title: string,
  scale?: LivePlotsColors
): VisualizationSpec => {
  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { name: 'values' },
    encoding: {
      x: {
        axis: { format: '0d', tickMinStep: 1 },
        field: 'iteration',
        title: 'iteration',
        type: 'quantitative'
      }
    },
    height: 'container',
    layer: [
      {
        encoding: {
          color: { field: 'group', legend: null, scale, type: 'nominal' },
          y: {
            field: 'y',
            scale: { zero: false },
            title,
            type: 'quantitative'
          }
        },
        layer: [
          { mark: 'line' },
          {
            mark: 'point',
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
          opacity: {
            condition: { empty: false, param: 'hover', value: 0.8 },
            value: 0
          }
        },
        mark: { tooltip: { content: 'data' }, type: 'rule' },
        params: [
          {
            name: 'hover',
            select: {
              clear: 'mouseout',
              fields: ['iteration'],
              nearest: true,
              on: 'mouseover',
              type: 'point'
            }
          }
        ],
        transform: [
          {
            as: 'y',
            calculate: "format(datum['y'],'.5f')"
          },
          {
            groupby: ['iteration'],
            op: 'mean',
            pivot: 'group',
            value: 'y'
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
        layer: [{ mark: { stroke: null, type: 'circle' } }]
      }
    ],
    width: 'container'
  }
}

const foregroundColor = 'var(--vscode-foreground)'
const backgroundColor = 'var(--vscode-editor-background)'
export const config: Config = {
  axis: {
    domain: false,
    gridOpacity: 0.25,
    labelAngle: 0,
    tickColor: foregroundColor,
    titleColor: foregroundColor
  },
  background: backgroundColor,
  mark: {
    stroke: foregroundColor
  },
  padding: 10,
  rule: {
    stroke: foregroundColor
  },
  style: {
    cell: {
      stroke: foregroundColor
    },
    'group-title': {
      fill: foregroundColor,
      stroke: foregroundColor
    },
    'guide-label': {
      fill: foregroundColor,
      stroke: foregroundColor
    },
    'guide-title': {
      fill: foregroundColor,
      stroke: foregroundColor
    },
    rule: {
      fill: foregroundColor,
      stroke: foregroundColor
    }
  }
}
