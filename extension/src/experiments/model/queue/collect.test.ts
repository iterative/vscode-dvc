import { collectFlatExperimentParams } from './collect'
import rowsFixture from '../../../test/fixtures/expShow/rows'
import { joinMetricOrParamPath } from '../../metricsAndParams/paths'
import { join } from '../../../test/util/path'

describe('collectFlatExperimentParams', () => {
  it('should flatten the params into an array', () => {
    const params = collectFlatExperimentParams(rowsFixture[0].params)
    expect(params).toEqual([
      { path: joinMetricOrParamPath('params.yaml', 'epochs'), value: 2 },
      {
        path: joinMetricOrParamPath('params.yaml', 'learning_rate'),
        value: 2.2e-7
      },
      {
        path: joinMetricOrParamPath('params.yaml', 'dvc_logs_dir'),
        value: 'dvc_logs'
      },
      {
        path: joinMetricOrParamPath('params.yaml', 'log_file'),
        value: 'logs.csv'
      },
      {
        path: joinMetricOrParamPath('params.yaml', 'dropout'),
        value: 0.122
      },
      {
        path: joinMetricOrParamPath('params.yaml', 'process', 'threshold'),
        value: 0.86
      },
      {
        path: joinMetricOrParamPath('params.yaml', 'process', 'test_arg'),
        value: 'string'
      },
      {
        path: joinMetricOrParamPath(join('nested', 'params.yaml'), 'test'),
        value: true
      }
    ])
  })
})
