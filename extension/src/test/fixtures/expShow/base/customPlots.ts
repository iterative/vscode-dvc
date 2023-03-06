import { copyOriginalColors } from '../../../../experiments/model/status/colors'
import {
  CustomPlotsData,
  CustomPlotType,
  PlotNumberOfItemsPerRow
} from '../../../../plots/webview/contract'

const colors = copyOriginalColors()

const data: CustomPlotsData = {
  colors: {
    domain: ['exp-e7a67', 'test-branch', 'exp-83425'],
    range: [colors[2], colors[3], colors[4]]
  },
  plots: [
    {
      id: 'custom-metrics:summary.json:loss-params:params.yaml:dropout',
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
          expName: 'exp-83425',
          metric: 1.9293040037155151,
          param: 0.25
        },
        {
          expName: 'exp-f13bca',
          metric: 2.298503875732422,
          param: 0.32
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
          metric: 0.4668000042438507,
          param: 16
        },
        {
          expName: 'exp-83425',
          metric: 0.3484833240509033,
          param: 10
        },
        {
          expName: 'exp-f13bca',
          metric: 0.6768440509033,
          param: 20
        }
      ],
      yTitle: 'summary.json:accuracy'
    }
  ],
  nbItemsPerRow: PlotNumberOfItemsPerRow.TWO,
  height: undefined
}

export default data
