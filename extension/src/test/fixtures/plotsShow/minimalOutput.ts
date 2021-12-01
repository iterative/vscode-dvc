import { VisualizationSpec } from 'react-vega'
import { PlotsType } from '../../../plots/webview/contract'

const data = {
  'logs/loss.tsv': [
    {
      content: {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        data: {
          values: [
            {
              loss: '1.453204870223999',
              rev: 'workspace',
              step: '0',
              timestamp: '1616731539649'
            },
            {
              loss: '1.4126659631729126',
              rev: 'workspace',
              step: '1',
              timestamp: '1616731571429'
            },
            {
              loss: '1.3743380308151245',
              rev: 'workspace',
              step: '2',
              timestamp: '1616731604846'
            },
            {
              loss: '1.337613582611084',
              rev: 'workspace',
              step: '3',
              timestamp: '1616731637451'
            },
            {
              loss: '1.3060474395751953',
              rev: 'workspace',
              step: '4',
              timestamp: '1616731668092'
            },
            {
              loss: '1.27475106716156',
              rev: 'workspace',
              step: '5',
              timestamp: '1616731699429'
            },
            {
              loss: '1.2455165386199951',
              rev: 'workspace',
              step: '6',
              timestamp: '1616731730637'
            },
            {
              loss: '1.2170413732528687',
              rev: 'workspace',
              step: '7',
              timestamp: '1616731762842'
            },
            {
              loss: '1.1903496980667114',
              rev: 'workspace',
              step: '8',
              timestamp: '1616731794035'
            },
            {
              loss: '1.1647908687591553',
              rev: 'workspace',
              step: '9',
              timestamp: '1616731824946'
            }
          ]
        },
        title: '',
        width: 300,
        height: 300,
        layer: [
          {
            encoding: {
              x: {
                field: 'step',
                type: 'quantitative',
                title: 'step'
              },
              y: {
                field: 'loss',
                type: 'quantitative',
                title: 'loss',
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
                mark: 'line'
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
                mark: {
                  type: 'rule',
                  color: 'gray'
                },
                encoding: {
                  x: {
                    field: 'step',
                    type: 'quantitative'
                  }
                }
              },
              {
                encoding: {
                  text: {
                    type: 'quantitative',
                    field: 'loss'
                  },
                  x: {
                    field: 'step',
                    type: 'quantitative'
                  },
                  y: {
                    field: 'loss',
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
      } as VisualizationSpec,
      type: PlotsType.VEGA
    }
  ]
}

export default data
