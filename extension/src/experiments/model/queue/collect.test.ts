import { join } from 'path'
import { collectFlatExperimentParams } from './collect'
import rowsFixture from '../../../test/fixtures/expShow/rows'
import { appendMetricOrParamToPath } from '../../metricsAndParams/paths'

describe('collectFlatExperimentParams', () => {
  it('should flatten the params into an array', () => {
    const params = collectFlatExperimentParams(rowsFixture[0].params)
    expect(params).toStrictEqual([
      { path: appendMetricOrParamToPath('params.yaml', 'epochs'), value: 2 },
      {
        path: appendMetricOrParamToPath('params.yaml', 'learning_rate'),
        value: 2.2e-7
      },
      {
        path: appendMetricOrParamToPath('params.yaml', 'dvc_logs_dir'),
        value: 'dvc_logs'
      },
      {
        path: appendMetricOrParamToPath('params.yaml', 'log_file'),
        value: 'logs.csv'
      },
      {
        path: appendMetricOrParamToPath('params.yaml', 'dropout'),
        value: 0.122
      },
      {
        path: appendMetricOrParamToPath('params.yaml', 'process', 'threshold'),
        value: 0.86
      },
      {
        path: appendMetricOrParamToPath('params.yaml', 'process', 'test_arg'),
        value: 'string'
      },
      {
        path: appendMetricOrParamToPath(join('nested', 'params.yaml'), 'test'),
        value: true
      }
    ])
  })
})
