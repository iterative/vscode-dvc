import { cleanupOldOrderValue } from './custom'
import { CustomPlotType } from '../webview/contract'
import { FILE_SEPARATOR } from '../../experiments/columns/paths'

describe('cleanupOlderValue', () => {
  it('should update value if contents are outdated', () => {
    const output = cleanupOldOrderValue(
      {
        metric: 'metrics:summary.json:loss',
        param: 'params:params.yaml:dropout'
      },
      FILE_SEPARATOR
    )
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
    const output = cleanupOldOrderValue(value, FILE_SEPARATOR)
    expect(output).toStrictEqual(value)
  })
})
