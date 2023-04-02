import type { ExperimentWithCheckpoints } from '../../../../experiments/model'
import { copyOriginalColors } from '../../../../experiments/model/status/colors'
import type { CustomPlotsOrderValue } from '../../../../plots/model/custom'
import {
  CustomPlotsData,
  CustomPlotType,
  DEFAULT_NB_ITEMS_PER_ROW,
  DEFAULT_PLOT_HEIGHT
} from '../../../../plots/webview/contract'

export const customPlotsOrderFixture: CustomPlotsOrderValue[] = [
  {
    metric: 'summary.json:loss',
    param: 'params.yaml:dropout',
    type: CustomPlotType.METRIC_VS_PARAM
  },
  {
    metric: 'summary.json:accuracy',
    param: 'params.yaml:epochs',
    type: CustomPlotType.METRIC_VS_PARAM
  },
  {
    metric: 'summary.json:loss',
    param: 'epoch',
    type: CustomPlotType.CHECKPOINT
  },
  {
    metric: 'summary.json:accuracy',
    param: 'epoch',
    type: CustomPlotType.CHECKPOINT
  }
]

export const experimentsWithCommits: ExperimentWithCheckpoints[] = [
  {
    id: 'main',
    label: 'label',
    metrics: {
      'summary.json': {
        loss: 2.048856019973755,
        accuracy: 0.3484833240509033
      }
    },
    name: 'main',
    params: { 'params.yaml': { dropout: 0.122, epochs: 5 } }
  },
  {
    id: '12345',
    metrics: {
      'summary.json': {
        accuracy: 0.3724166750907898,
        loss: 2.0205044746398926
      }
    },
    label: 'exp-e7a67',
    params: { 'params.yaml': { dropout: 0.15, epochs: 2 } },
    checkpoints: [
      {
        id: '12345',
        metrics: {
          'summary.json': {
            accuracy: 0.3724166750907898,
            loss: 2.0205044746398926
          }
        },
        label: 'exp-e7a67',
        params: { 'params.yaml': { dropout: 0.15, epochs: 2 } }
      },
      {
        id: '12345',
        label: '123',
        metrics: {
          'summary.json': {
            accuracy: 0.3723166584968567,
            loss: 2.020392894744873
          }
        },
        name: 'exp-e7a67',
        params: { 'params.yaml': { dropout: 0.15, epochs: 2 } }
      }
    ]
  },
  {
    id: '12345',
    label: '123',
    metrics: {
      'summary.json': {
        accuracy: 0.4668000042438507,
        loss: 1.9293040037155151
      }
    },
    name: 'test-branch',
    params: { 'params.yaml': { dropout: 0.122, epochs: 2 } },
    checkpoints: [
      {
        id: '12345',
        label: '123',
        metrics: {
          'summary.json': {
            accuracy: 0.4668000042438507,
            loss: 1.9293040037155151
          }
        },
        name: 'test-branch',
        params: { 'params.yaml': { dropout: 0.122, epochs: 2 } }
      },
      {
        id: '12345',
        label: '123',
        metrics: {
          'summary.json': {
            accuracy: 0.4083833396434784,
            loss: 1.9882521629333496
          }
        },
        name: 'test-branch',
        params: { 'params.yaml': { dropout: 0.122, epochs: 2 } }
      }
    ]
  },
  {
    id: '12345',
    label: '123',
    metrics: {
      'summary.json': {
        accuracy: 0.5926499962806702,
        loss: 1.775016188621521
      }
    },
    name: 'exp-83425',
    params: { 'params.yaml': { dropout: 0.124, epochs: 5 } },
    checkpoints: [
      {
        id: '12345',
        label: '123',
        metrics: {
          'summary.json': {
            accuracy: 0.5926499962806702,
            loss: 1.775016188621521
          }
        },
        name: 'exp-83425',
        params: { 'params.yaml': { dropout: 0.124, epochs: 5 } }
      },
      {
        id: '12345',
        label: '123',
        metrics: {
          'summary.json': {
            accuracy: 0.557449996471405,
            loss: 1.8261293172836304
          }
        },
        name: 'exp-83425',
        params: { 'params.yaml': { dropout: 0.124, epochs: 5 } }
      },
      {
        id: '12345',
        label: '123',
        metrics: {
          'summary.json': {
            accuracy: 0.5113166570663452,
            loss: 1.8798457384109497
          }
        },
        name: 'exp-83425',
        params: { 'params.yaml': { dropout: 0.124, epochs: 5 } }
      },
      {
        id: '12345',
        label: '123',
        metrics: {
          'summary.json': {
            accuracy: 0.46094998717308044,
            loss: 1.9329891204833984
          }
        },
        name: 'exp-83425',
        params: { 'params.yaml': { dropout: 0.124, epochs: 5 } }
      },
      {
        id: '12345',
        label: '123',
        metrics: {
          'summary.json': {
            accuracy: 0.40904998779296875,
            loss: 1.9896177053451538
          }
        },
        name: 'exp-83425',
        params: { 'params.yaml': { dropout: 0.124, epochs: 5 } }
      }
    ]
  }
]

const colors = copyOriginalColors()

const data: CustomPlotsData = {
  colors: {
    domain: ['exp-e7a67', 'test-branch', 'exp-83425'],
    range: [colors[2], colors[3], colors[4]]
  },
  enablePlotCreation: true,
  plots: [
    {
      id: 'custom-summary.json:loss-params.yaml:dropout',
      metric: 'summary.json:loss',
      param: 'params.yaml:dropout',
      type: CustomPlotType.METRIC_VS_PARAM,
      values: [
        {
          expName: 'main',
          metric: 2.048856019973755,
          param: 0.122
        },
        {
          expName: 'exp-e7a67',
          metric: 2.0205044746398926,
          param: 0.15
        },
        {
          expName: 'test-branch',
          metric: 1.9293040037155151,
          param: 0.122
        },
        {
          expName: 'exp-83425',
          metric: 1.775016188621521,
          param: 0.124
        }
      ],
      yTitle: 'summary.json:loss'
    },
    {
      id: 'custom-summary.json:accuracy-params.yaml:epochs',
      metric: 'summary.json:accuracy',
      param: 'params.yaml:epochs',
      type: CustomPlotType.METRIC_VS_PARAM,
      values: [
        {
          expName: 'main',
          metric: 0.3484833240509033,
          param: 5
        },
        {
          expName: 'exp-e7a67',
          metric: 0.3724166750907898,
          param: 2
        },
        {
          expName: 'test-branch',
          metric: 0.4668000042438507,
          param: 2
        },
        {
          expName: 'exp-83425',
          metric: 0.5926499962806702,
          param: 5
        }
      ],
      yTitle: 'summary.json:accuracy'
    },
    {
      id: 'custom-summary.json:loss-epoch',
      metric: 'summary.json:loss',
      param: 'epoch',
      values: [
        { group: 'exp-e7a67', iteration: 3, y: 2.0205044746398926 },
        { group: 'exp-e7a67', iteration: 2, y: 2.0205044746398926 },
        { group: 'exp-e7a67', iteration: 1, y: 2.020392894744873 },
        { group: 'test-branch', iteration: 3, y: 1.9293040037155151 },
        { group: 'test-branch', iteration: 2, y: 1.9293040037155151 },
        { group: 'test-branch', iteration: 1, y: 1.9882521629333496 },
        { group: 'exp-83425', iteration: 6, y: 1.775016188621521 },
        { group: 'exp-83425', iteration: 5, y: 1.775016188621521 },
        { group: 'exp-83425', iteration: 4, y: 1.8261293172836304 },
        { group: 'exp-83425', iteration: 3, y: 1.8798457384109497 },
        { group: 'exp-83425', iteration: 2, y: 1.9329891204833984 },
        { group: 'exp-83425', iteration: 1, y: 1.9896177053451538 }
      ],
      type: CustomPlotType.CHECKPOINT,
      yTitle: 'summary.json:loss'
    },
    {
      id: 'custom-summary.json:accuracy-epoch',
      metric: 'summary.json:accuracy',
      param: 'epoch',
      values: [
        { group: 'exp-e7a67', iteration: 3, y: 0.3724166750907898 },
        { group: 'exp-e7a67', iteration: 2, y: 0.3724166750907898 },
        { group: 'exp-e7a67', iteration: 1, y: 0.3723166584968567 },
        { group: 'test-branch', iteration: 3, y: 0.4668000042438507 },
        { group: 'test-branch', iteration: 2, y: 0.4668000042438507 },
        { group: 'test-branch', iteration: 1, y: 0.4083833396434784 },
        { group: 'exp-83425', iteration: 6, y: 0.5926499962806702 },
        { group: 'exp-83425', iteration: 5, y: 0.5926499962806702 },
        { group: 'exp-83425', iteration: 4, y: 0.557449996471405 },
        { group: 'exp-83425', iteration: 3, y: 0.5113166570663452 },
        { group: 'exp-83425', iteration: 2, y: 0.46094998717308044 },
        { group: 'exp-83425', iteration: 1, y: 0.40904998779296875 }
      ],
      type: CustomPlotType.CHECKPOINT,
      yTitle: 'summary.json:accuracy'
    }
  ],
  nbItemsPerRow: DEFAULT_NB_ITEMS_PER_ROW,
  height: DEFAULT_PLOT_HEIGHT
}

export default data
