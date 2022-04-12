import { join } from 'path'
import rowsFixture from 'dvc-fixtures/src/expShow/rows'
import { collectFlatExperimentParams } from './collect'
import { joinMetricOrParamFilePath } from '../../metricsAndParams/paths'

describe('collectFlatExperimentParams', () => {
  it('should flatten the params into an array', () => {
    const params = collectFlatExperimentParams(rowsFixture[0].params)
    expect(params).toStrictEqual([
      { path: joinMetricOrParamFilePath('params.yaml', 'epochs'), value: 2 },
      {
        path: joinMetricOrParamFilePath('params.yaml', 'learning_rate'),
        value: 2.2e-7
      },
      {
        path: joinMetricOrParamFilePath('params.yaml', 'dvc_logs_dir'),
        value: 'dvc_logs'
      },
      {
        path: joinMetricOrParamFilePath('params.yaml', 'log_file'),
        value: 'logs.csv'
      },
      {
        path: joinMetricOrParamFilePath('params.yaml', 'dropout'),
        value: 0.122
      },
      {
        path: joinMetricOrParamFilePath('params.yaml', 'process', 'threshold'),
        value: 0.86
      },
      {
        path: joinMetricOrParamFilePath('params.yaml', 'process', 'test_arg'),
        value: 'string'
      },
      {
        path: joinMetricOrParamFilePath(join('nested', 'params.yaml'), 'test'),
        value: true
      }
    ])
  })
})
