import { copyOriginalColors } from '../../../../experiments/model/status/colors'
import { CustomPlotsOrderValue } from '../../../../plots/model/custom'
import {
  CustomPlotsData,
  CustomPlotType,
  PlotNumberOfItemsPerRow
} from '../../../../plots/webview/contract'

export const customPlotsOrderFixture: CustomPlotsOrderValue[] = [
  {
    metric: 'metrics:summary.json:loss',
    param: 'params:params.yaml:dropout',
    type: CustomPlotType.METRIC_VS_PARAM
  },
  {
    metric: 'metrics:summary.json:accuracy',
    param: 'params:params.yaml:epochs',
    type: CustomPlotType.METRIC_VS_PARAM
  },
  {
    metric: 'metrics:summary.json:loss',
    type: CustomPlotType.CHECKPOINT
  },
  {
    metric: 'metrics:summary.json:accuracy',
    type: CustomPlotType.CHECKPOINT
  }
]
const colors = copyOriginalColors()

const data: CustomPlotsData = {
  colors: {
    domain: ['exp-e7a67', 'test-branch', 'exp-83425'],
    range: [colors[2], colors[3], colors[4]]
  },
  plots: [
    {
      id: 'custom-metrics:summary.json:loss-params:params.yaml:dropout',
      // TBD I don't think we actually need metric/param here
      // since I think only title is used in in the front end
      metric: 'summary.json:loss',
      param: 'params.yaml:dropout',
      type: CustomPlotType.METRIC_VS_PARAM,
      values: [
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
      id: 'custom-metrics:summary.json:accuracy-params:params.yaml:epochs',
      metric: 'summary.json:accuracy',
      param: 'params.yaml:epochs',
      type: CustomPlotType.METRIC_VS_PARAM,
      values: [
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
      id: 'custom-summary.json:loss',
      metric: 'summary.json:loss',
      values: [
        { group: 'exp-83425', iteration: 1, y: 1.9896177053451538 },
        { group: 'exp-83425', iteration: 2, y: 1.9329891204833984 },
        { group: 'exp-83425', iteration: 3, y: 1.8798457384109497 },
        { group: 'exp-83425', iteration: 4, y: 1.8261293172836304 },
        { group: 'exp-83425', iteration: 5, y: 1.775016188621521 },
        { group: 'exp-83425', iteration: 6, y: 1.775016188621521 },
        { group: 'test-branch', iteration: 1, y: 1.9882521629333496 },
        { group: 'test-branch', iteration: 2, y: 1.9293040037155151 },
        { group: 'test-branch', iteration: 3, y: 1.9293040037155151 },
        { group: 'exp-e7a67', iteration: 1, y: 2.020392894744873 },
        { group: 'exp-e7a67', iteration: 2, y: 2.0205044746398926 },
        { group: 'exp-e7a67', iteration: 3, y: 2.0205044746398926 }
      ],
      type: CustomPlotType.CHECKPOINT,
      yTitle: 'summary.json:loss'
    },
    {
      id: 'custom-summary.json:accuracy',
      metric: 'summary.json:accuracy',
      values: [
        { group: 'exp-83425', iteration: 1, y: 0.40904998779296875 },
        { group: 'exp-83425', iteration: 2, y: 0.46094998717308044 },
        { group: 'exp-83425', iteration: 3, y: 0.5113166570663452 },
        { group: 'exp-83425', iteration: 4, y: 0.557449996471405 },
        { group: 'exp-83425', iteration: 5, y: 0.5926499962806702 },
        { group: 'exp-83425', iteration: 6, y: 0.5926499962806702 },
        { group: 'test-branch', iteration: 1, y: 0.4083833396434784 },
        { group: 'test-branch', iteration: 2, y: 0.4668000042438507 },
        { group: 'test-branch', iteration: 3, y: 0.4668000042438507 },
        { group: 'exp-e7a67', iteration: 1, y: 0.3723166584968567 },
        { group: 'exp-e7a67', iteration: 2, y: 0.3724166750907898 },
        { group: 'exp-e7a67', iteration: 3, y: 0.3724166750907898 }
      ],
      type: CustomPlotType.CHECKPOINT,
      yTitle: 'summary.json:accuracy'
    }
  ],
  nbItemsPerRow: PlotNumberOfItemsPerRow.TWO,
  height: undefined
}

export default data
