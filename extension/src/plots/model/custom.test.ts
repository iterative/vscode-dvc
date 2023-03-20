import {
  CHECKPOINTS_PARAM,
  cleanupOldOrderValue,
  doesCustomPlotAlreadyExist
} from './custom'
import { CustomPlotType } from '../webview/contract'
import { FILE_SEPARATOR } from '../../experiments/columns/paths'

describe('doesCustomPlotAlreadyExist', () => {
  it('should return true if plot exists', () => {
    const output = doesCustomPlotAlreadyExist(
      [
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
          param: CHECKPOINTS_PARAM,
          type: CustomPlotType.CHECKPOINT
        }
      ],
      'summary.json:accuracy',
      'params.yaml:epochs'
    )
    expect(output).toStrictEqual(true)
  })

  it('should return false if plot does not exists', () => {
    const output = doesCustomPlotAlreadyExist(
      [
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
          param: CHECKPOINTS_PARAM,
          type: CustomPlotType.CHECKPOINT
        }
      ],
      'summary.json:loss',
      'params.yaml:epochs'
    )
    expect(output).toStrictEqual(false)
  })
})

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
