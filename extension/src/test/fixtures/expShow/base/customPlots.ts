import {
  CustomPlotsData,
  DEFAULT_NB_ITEMS_PER_ROW
} from '../../../../plots/webview/contract'

const data: CustomPlotsData = {
  plots: [
    {
      id: 'custom-metrics:summary.json:loss-params:params.yaml:dropout',
      metric: 'summary.json:loss',
      param: 'params.yaml:dropout',
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
      ]
    },
    {
      id: 'custom-metrics:summary.json:accuracy-params:params.yaml:epochs',
      metric: 'summary.json:accuracy',
      param: 'params.yaml:epochs',
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
      ]
    }
  ],
  nbItemsPerRow: DEFAULT_NB_ITEMS_PER_ROW,
  height: undefined
}

export default data
