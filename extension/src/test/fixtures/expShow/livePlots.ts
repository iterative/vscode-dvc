import { DefaultSectionNames } from '../../../plots/model'
import {
  LivePlotsData,
  PlotSize,
  Section
} from '../../../plots/webview/contract'

const data: LivePlotsData = {
  colors: {
    domain: [
      '4fb124a [exp-e7a67]',
      '42b8736 [test-branch]',
      '1ba7bcd [exp-83425]'
    ],
    range: ['#f14c4c', '#3794ff', '#cca700']
  },
  plots: [
    {
      title: 'summary.json:loss',
      values: [
        {
          group: '1ba7bcd [exp-83425]',
          iteration: 1,
          y: 1.9896177053451538
        },
        {
          group: '1ba7bcd [exp-83425]',
          iteration: 2,
          y: 1.9329891204833984
        },
        {
          group: '1ba7bcd [exp-83425]',
          iteration: 3,
          y: 1.8798457384109497
        },
        {
          group: '1ba7bcd [exp-83425]',
          iteration: 4,
          y: 1.8261293172836304
        },
        {
          group: '1ba7bcd [exp-83425]',
          iteration: 5,
          y: 1.775016188621521
        },
        {
          group: '42b8736 [test-branch]',
          iteration: 1,
          y: 1.9882521629333496
        },
        {
          group: '42b8736 [test-branch]',
          iteration: 2,
          y: 1.9293040037155151
        },
        {
          group: '4fb124a [exp-e7a67]',
          iteration: 1,
          y: 2.020392894744873
        },
        {
          group: '4fb124a [exp-e7a67]',
          iteration: 2,
          y: 2.0205044746398926
        }
      ]
    },
    {
      title: 'summary.json:accuracy',
      values: [
        {
          group: '1ba7bcd [exp-83425]',
          iteration: 1,
          y: 0.40904998779296875
        },
        {
          group: '1ba7bcd [exp-83425]',
          iteration: 2,
          y: 0.46094998717308044
        },
        {
          group: '1ba7bcd [exp-83425]',
          iteration: 3,
          y: 0.5113166570663452
        },
        {
          group: '1ba7bcd [exp-83425]',
          iteration: 4,
          y: 0.557449996471405
        },
        {
          group: '1ba7bcd [exp-83425]',
          iteration: 5,
          y: 0.5926499962806702
        },
        {
          group: '42b8736 [test-branch]',
          iteration: 1,
          y: 0.4083833396434784
        },
        {
          group: '42b8736 [test-branch]',
          iteration: 2,
          y: 0.4668000042438507
        },
        {
          group: '4fb124a [exp-e7a67]',
          iteration: 1,
          y: 0.3723166584968567
        },
        {
          group: '4fb124a [exp-e7a67]',
          iteration: 2,
          y: 0.3724166750907898
        }
      ]
    },
    {
      title: 'summary.json:val_loss',
      values: [
        {
          group: '1ba7bcd [exp-83425]',
          iteration: 1,
          y: 1.9391471147537231
        },
        {
          group: '1ba7bcd [exp-83425]',
          iteration: 2,
          y: 1.8825950622558594
        },
        {
          group: '1ba7bcd [exp-83425]',
          iteration: 3,
          y: 1.827923059463501
        },
        {
          group: '1ba7bcd [exp-83425]',
          iteration: 4,
          y: 1.7749212980270386
        },
        {
          group: '1ba7bcd [exp-83425]',
          iteration: 5,
          y: 1.7233840227127075
        },
        {
          group: '42b8736 [test-branch]',
          iteration: 1,
          y: 1.9363881349563599
        },
        {
          group: '42b8736 [test-branch]',
          iteration: 2,
          y: 1.8770883083343506
        },
        {
          group: '4fb124a [exp-e7a67]',
          iteration: 1,
          y: 1.9979370832443237
        },
        {
          group: '4fb124a [exp-e7a67]',
          iteration: 2,
          y: 1.9979370832443237
        }
      ]
    },
    {
      title: 'summary.json:val_accuracy',
      values: [
        {
          group: '1ba7bcd [exp-83425]',
          iteration: 1,
          y: 0.49399998784065247
        },
        {
          group: '1ba7bcd [exp-83425]',
          iteration: 2,
          y: 0.5550000071525574
        },
        {
          group: '1ba7bcd [exp-83425]',
          iteration: 3,
          y: 0.6035000085830688
        },
        {
          group: '1ba7bcd [exp-83425]',
          iteration: 4,
          y: 0.6414999961853027
        },
        {
          group: '1ba7bcd [exp-83425]',
          iteration: 5,
          y: 0.6704000234603882
        },
        {
          group: '42b8736 [test-branch]',
          iteration: 1,
          y: 0.4970000088214874
        },
        {
          group: '42b8736 [test-branch]',
          iteration: 2,
          y: 0.5608000159263611
        },
        {
          group: '4fb124a [exp-e7a67]',
          iteration: 1,
          y: 0.4277999997138977
        },
        {
          group: '4fb124a [exp-e7a67]',
          iteration: 2,
          y: 0.4277999997138977
        }
      ]
    }
  ],
  selectedMetrics: undefined,
  size: PlotSize.REGULAR,
  sectionName: DefaultSectionNames[Section.LIVE_PLOTS]
}

export default data
