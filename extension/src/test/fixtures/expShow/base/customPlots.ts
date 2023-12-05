import type { TopLevelSpec } from 'vega-lite'
import type { CustomPlotsOrderValue } from '../../../../plots/model/custom'
import {
  CustomPlotsData,
  DEFAULT_NB_ITEMS_PER_ROW,
  DEFAULT_PLOT_HEIGHT
} from '../../../../plots/webview/contract'
import { Experiment } from '../../../../experiments/webview/contract'
import { PLOT_ANCHORS, ZOOM_AND_PAN_PROP } from '../../../../cli/dvc/contract'

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
      content: {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        data: { values: PLOT_ANCHORS.DATA },
        encoding: {
          color: PLOT_ANCHORS.COLOR,
          x: {
            axis: {
              labelLimit: 75,
              titlePadding: 30
            },
            field: 'param',
            scale: {
              zero: false
            },
            title: PLOT_ANCHORS.X_LABEL,
            type: PLOT_ANCHORS.PARAM_TYPE
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
            title: PLOT_ANCHORS.Y_LABEL,
            type: PLOT_ANCHORS.METRIC_TYPE
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
                  title: PLOT_ANCHORS.Y_LABEL
                },
                {
                  field: 'param',
                  title: PLOT_ANCHORS.X_LABEL
                }
              ]
            },
            mark: {
              filled: true,
              size: 60,
              type: 'point'
            },
            params: [PLOT_ANCHORS.ZOOM_AND_PAN]
          }
        ],
        width: 'container'
      } as unknown as TopLevelSpec,
      anchorDefinitions: {
        [PLOT_ANCHORS.PARAM_TYPE]: 'nominal',
        [PLOT_ANCHORS.COLOR]: {
          field: 'id',
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
        [PLOT_ANCHORS.DATA]: [
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
        ],
        [PLOT_ANCHORS.METRIC_TYPE]: 'quantitative',
        [PLOT_ANCHORS.X_LABEL]: 'params.yaml:log_file',
        [PLOT_ANCHORS.Y_LABEL]: 'summary.json:loss',
        [PLOT_ANCHORS.ZOOM_AND_PAN]: ZOOM_AND_PAN_PROP
      }
    },
    {
      id: 'custom-summary.json:accuracy-params.yaml:epochs',
      metric: 'summary.json:accuracy',
      param: 'params.yaml:epochs',
      anchorDefinitions: {
        [PLOT_ANCHORS.PARAM_TYPE]: 'quantitative',
        [PLOT_ANCHORS.COLOR]: {
          field: 'id',
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
        [PLOT_ANCHORS.DATA]: [
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
        [PLOT_ANCHORS.METRIC_TYPE]: 'quantitative',
        [PLOT_ANCHORS.X_LABEL]: 'params.yaml:epochs',
        [PLOT_ANCHORS.Y_LABEL]: 'summary.json:accuracy',
        [PLOT_ANCHORS.ZOOM_AND_PAN]: ZOOM_AND_PAN_PROP
      },
      content: {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        data: { values: PLOT_ANCHORS.DATA },
        encoding: {
          color: PLOT_ANCHORS.COLOR,
          x: {
            axis: {
              labelLimit: 75,
              titlePadding: 30
            },
            field: 'param',
            scale: {
              zero: false
            },
            title: PLOT_ANCHORS.X_LABEL,
            type: PLOT_ANCHORS.PARAM_TYPE
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
            title: PLOT_ANCHORS.Y_LABEL,
            type: PLOT_ANCHORS.METRIC_TYPE
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
                  title: PLOT_ANCHORS.Y_LABEL
                },
                {
                  field: 'param',
                  title: PLOT_ANCHORS.X_LABEL
                }
              ]
            },
            mark: {
              filled: true,
              size: 60,
              type: 'point'
            },
            params: [PLOT_ANCHORS.ZOOM_AND_PAN]
          }
        ],
        width: 'container'
      } as unknown as TopLevelSpec
    }
  ],
  nbItemsPerRow: DEFAULT_NB_ITEMS_PER_ROW,
  height: DEFAULT_PLOT_HEIGHT,
  hasAddedPlots: true,
  hasUnfilteredExperiments: true
}

export default data
