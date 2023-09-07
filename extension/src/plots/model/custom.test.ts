import { checkForCustomPlotOptions, cleanupOldOrderValue } from './custom'
import { customPlotsOrderFixture } from '../../test/fixtures/expShow/base/customPlots'
import { ColumnType } from '../../experiments/webview/contract'

describe('cleanupOlderValue', () => {
  it('should update value if contents are outdated', () => {
    const output = cleanupOldOrderValue({
      metric: 'metrics:summary.json:loss',
      param: 'params:params.yaml:log_file'
    })
    expect(output).toStrictEqual({
      metric: 'summary.json:loss',
      param: 'params.yaml:log_file'
    })
  })

  it('should not update value if contents are not outdated', () => {
    const value = {
      metric: 'summary.json:loss',
      param: 'params.yaml:log_file'
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
          label: 'log_file',
          path: 'params:params.yaml:log_file',
          type: ColumnType.PARAMS
        },
        {
          hasChildren: false,
          label: 'log_file',
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
          label: 'log_file',
          path: 'params:params.yaml:log_file',
          type: ColumnType.PARAMS
        },
        {
          hasChildren: false,
          label: 'log_file',
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
          param: 'params.yaml:log_file'
        },
        {
          metric: 'summary.json:loss',
          param: 'params.yaml:epochs'
        }
      ]
    )
    expect(output).toStrictEqual(false)
  })
})
