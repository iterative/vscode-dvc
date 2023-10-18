import type { CustomPlotsOrderValue } from '../../../../plots/model/custom'
import {
  CustomPlotsData,
  DEFAULT_NB_ITEMS_PER_ROW,
  DEFAULT_PLOT_HEIGHT
} from '../../../../plots/webview/contract'
import { Experiment } from '../../../../experiments/webview/contract'
import { Title } from 'vega'

export const customPlotsOrderFixture: CustomPlotsOrderValue[] = [
  {
    metric: 'summary.json:loss',
    param: 'params.yaml:log_file'
  },
  {
    metric: 'summary.json:accuracy',
    param: 'params.yaml:epochs'
  }
]

export const experimentsWithCommits: Experiment[] = [
  {
    branch: 'main',
    id: 'main',
    label: 'label',
    metrics: {
      'summary.json': {
        loss: 2.048856019973755,
        accuracy: 0.3484833240509033
      }
    },
    params: { 'params.yaml': { log_file: 'logs.csv', epochs: 5 } }
  },
  {
    branch: 'main',
    id: 'fe2919b',
    label: 'label',
    metrics: {
      'summary.json': {
        loss: 2.048856019973755,
        accuracy: 0.3484833240509033
      }
    },
    params: { 'params.yaml': { log_file: 'logs.csv', epochs: 5 } }
  },
  {
    branch: 'main',
    id: '7df876c',
    label: 'label',
    metrics: {
      'summary.json': {
        loss: 2.048856019973755,
        accuracy: 0.3484833240509033
      }
    },
    params: { 'params.yaml': { log_file: 'logs.csv', epochs: 5 } }
  },
  {
    branch: 'main',
    id: 'exp-e7a67',
    metrics: {
      'summary.json': {
        accuracy: 0.3724166750907898,
        loss: 2.0205044746398926
      }
    },
    label: '1224',
    params: { 'params.yaml': { log_file: 'logs.csv', epochs: 2 } }
  },
  {
    branch: 'main',
    id: 'test-branch',
    label: '123',
    metrics: {
      'summary.json': {
        accuracy: 0.4668000042438507,
        loss: 1.9293040037155151
      }
    },
    params: { 'params.yaml': { log_file: 'logs.csv', epochs: 2 } }
  },
  {
    branch: 'main',
    id: 'exp-83425',
    label: '123',
    metrics: {
      'summary.json': {
        accuracy: 0.5926499962806702,
        loss: 1.775016188621521
      }
    },
    params: { 'params.yaml': { log_file: 'logs.csv', epochs: 5 } }
  }
]

const data: CustomPlotsData = {
  plots: [
    {
      id: 'custom-summary.json:loss-params.yaml:log_file',
      metric: 'summary.json:loss',
      param: 'params.yaml:log_file',
      spec: {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        data: { name: 'values' },
        encoding: {
          color: {
            field: 'id',
            legend: null,
            scale: {
              domain: [
                'main',
                'exp-e7a67',
                'test-branch',
                'exp-83425',
                'fe2919b',
                '7df876c'
              ],
              range: [
                '#13adc7',
                '#f46837',
                '#48bb78',
                '#4299e1',
                '#4c78a8',
                '#4c78a8'
              ]
            }
          },
          x: {
            axis: {
              labelLimit: 75,
              titlePadding: 30
            },
            field: 'param',
            scale: {
              zero: false
            },
            title: 'params.yaml:log_file',
            type: 'nominal'
          },
          y: {
            axis: {
              labelLimit: 75,
              titlePadding: 30
            },
            field: 'metric',
            scale: {
              zero: false
            },
            title: 'summary.json:loss',
            type: 'quantitative'
          }
        },
        height: 'container',
        layer: [
          {
            encoding: {
              tooltip: [
                {
                  field: 'id',
                  title: 'id'
                },
                {
                  field: 'metric',
                  title: 'summary.json:loss'
                },
                {
                  field: 'param',
                  title: 'params.yaml:log_file'
                }
              ]
            },
            mark: {
              filled: true,
              size: 60,
              type: 'point'
            }
          }
        ],
        width: 'container',
        titles: {
          main: { normal: '' as unknown as Title, truncated: '' },
          x: { normal: '' as unknown as Title, truncated: '' },
          y: { normal: '' as unknown as Title, truncated: '' }
        }
      },
      values: [
        { id: '7df876c', metric: 2.048856019973755, param: 'logs.csv' },
        {
          id: 'fe2919b',
          metric: 2.048856019973755,
          param: 'logs.csv'
        },
        { id: 'main', metric: 2.048856019973755, param: 'logs.csv' },
        { id: 'exp-e7a67', metric: 2.0205044746398926, param: 'logs.csv' },
        { id: 'test-branch', metric: 1.9293040037155151, param: 'logs.csv' },
        {
          id: 'exp-83425',
          metric: 1.775016188621521,
          param: 'logs.csv'
        }
      ]
    },
    {
      id: 'custom-summary.json:accuracy-params.yaml:epochs',
      metric: 'summary.json:accuracy',
      param: 'params.yaml:epochs',
      values: [
        {
          id: '7df876c',
          metric: 0.3484833240509033,
          param: 5
        },
        {
          id: 'fe2919b',
          metric: 0.3484833240509033,
          param: 5
        },
        {
          id: 'main',
          metric: 0.3484833240509033,
          param: 5
        },
        {
          id: 'exp-e7a67',
          metric: 0.3724166750907898,
          param: 2
        },
        {
          id: 'test-branch',
          metric: 0.4668000042438507,
          param: 2
        },
        {
          id: 'exp-83425',
          metric: 0.5926499962806702,
          param: 5
        }
      ],
      spec: {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        data: { name: 'values' },
        encoding: {
          color: {
            field: 'id',
            legend: null,
            scale: {
              domain: [
                'main',
                'exp-e7a67',
                'test-branch',
                'exp-83425',
                'fe2919b',
                '7df876c'
              ],
              range: [
                '#13adc7',
                '#f46837',
                '#48bb78',
                '#4299e1',
                '#4c78a8',
                '#4c78a8'
              ]
            }
          },
          x: {
            axis: {
              labelLimit: 75,
              titlePadding: 30
            },
            field: 'param',
            scale: {
              zero: false
            },
            title: 'params.yaml:epochs',
            type: 'quantitative'
          },
          y: {
            axis: {
              labelLimit: 75,
              titlePadding: 30
            },
            field: 'metric',
            scale: {
              zero: false
            },
            title: 'summary.json:accuracy',
            type: 'quantitative'
          }
        },
        height: 'container',
        layer: [
          {
            encoding: {
              tooltip: [
                {
                  field: 'id',
                  title: 'id'
                },
                {
                  field: 'metric',
                  title: 'summary.json:accuracy'
                },
                {
                  field: 'param',
                  title: 'params.yaml:epochs'
                }
              ]
            },
            mark: {
              filled: true,
              size: 60,
              type: 'point'
            }
          }
        ],
        width: 'container',
        titles: {
          main: { normal: '' as unknown as Title, truncated: '' },
          x: { normal: '' as unknown as Title, truncated: '' },
          y: { normal: '' as unknown as Title, truncated: '' }
        }
      }
    }
  ],
  nbItemsPerRow: DEFAULT_NB_ITEMS_PER_ROW,
  height: DEFAULT_PLOT_HEIGHT,
  hasAddedPlots: true,
  hasUnfilteredExperiments: true
}

export default data
