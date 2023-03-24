import { checkForCustomPlotOptions, cleanupOldOrderValue } from './custom'
import { CustomPlotType } from '../webview/contract'
import { customPlotsOrderFixture } from '../../test/fixtures/expShow/base/customPlots'
import { ColumnType } from '../../experiments/webview/contract'

describe('cleanupOlderValue', () => {
  it('should update value if contents are outdated', () => {
    const output = cleanupOldOrderValue({
      metric: 'metrics:summary.json:loss',
      param: 'params:params.yaml:dropout'
    })
    expect(output).toStrictEqual({
      metric: 'summary.json:loss',
      param: 'params.yaml:dropout',
      type: CustomPlotType.METRIC_VS_PARAM
    })
  })

  it('should not update value if contents are not outdated', () => {
    const value = {
      metric: 'summary.json:loss',
      param: 'params.yaml:dropout',
      type: CustomPlotType.METRIC_VS_PARAM
    }
    const output = cleanupOldOrderValue(value)
    expect(output).toStrictEqual(value)
  })
})

describe('checkForCustomPlotOptions', () => {
  it('should return true if there are plots available', () => {
    const output = checkForCustomPlotOptions(
      [
        {
          hasChildren: false,
          label: 'dropout',
          path: 'params:params.yaml:dropout',
          type: ColumnType.PARAMS
        },
        {
          hasChildren: false,
          label: 'dropout',
          path: 'params:params.yaml:epochs',
          type: ColumnType.PARAMS
        },
        {
          hasChildren: false,
          label: 'accuracy',
          path: 'metrics:summary.json:loss',
          type: ColumnType.METRICS
        },
        {
          hasChildren: false,
          label: 'accuracy',
          path: 'metrics:summary.json:accuracy',
          type: ColumnType.METRICS
        }
      ],
      customPlotsOrderFixture
    )
    expect(output).toStrictEqual(true)
  })

  it('should return false if there are no plots available', () => {
    const output = checkForCustomPlotOptions(
      [
        {
          hasChildren: false,
          label: 'dropout',
          path: 'params:params.yaml:dropout',
          type: ColumnType.PARAMS
        },
        {
          hasChildren: false,
          label: 'dropout',
          path: 'params:params.yaml:epochs',
          type: ColumnType.PARAMS
        },
        {
          hasChildren: false,
          label: 'accuracy',
          path: 'metrics:summary.json:loss',
          type: ColumnType.METRICS
        },
        {
          hasChildren: false,
          label: 'accuracy',
          path: 'metrics:summary.json:accuracy',
          type: ColumnType.METRICS
        }
      ],
      [
        ...customPlotsOrderFixture,
        {
          metric: 'summary.json:accuracy',
          param: 'params.yaml:dropout',
          type: CustomPlotType.METRIC_VS_PARAM
        },
        {
          metric: 'summary.json:loss',
          param: 'params.yaml:epochs',
          type: CustomPlotType.METRIC_VS_PARAM
        }
      ]
    )
    expect(output).toStrictEqual(false)
  })
})
