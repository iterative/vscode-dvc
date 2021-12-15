import { collectFlatExperimentParams } from './collect'
import rowsFixture from '../../../test/fixtures/expShow/rows'
import { joinParamOrMetricFilePath } from '../../paramsAndMetrics/paths'
import { join } from '../../../test/util/path'

describe('collectFlatExperimentParams', () => {
  it('should flatten the params into an array', () => {
    const params = collectFlatExperimentParams(rowsFixture[0].params)
    expect(params).toEqual([
      { path: joinParamOrMetricFilePath('params.yaml', 'epochs'), value: 2 },
      {
        path: joinParamOrMetricFilePath('params.yaml', 'learning_rate'),
        value: 2.2e-7
      },
      {
        path: joinParamOrMetricFilePath('params.yaml', 'dvc_logs_dir'),
        value: 'dvc_logs'
      },
      {
        path: joinParamOrMetricFilePath('params.yaml', 'log_file'),
        value: 'logs.csv'
      },
      {
        path: joinParamOrMetricFilePath('params.yaml', 'dropout'),
        value: 0.122
      },
      {
        path: joinParamOrMetricFilePath('params.yaml', 'process.threshold'),
        value: 0.86
      },
      {
        path: joinParamOrMetricFilePath('params.yaml', 'process.test_arg'),
        value: 'string'
      },
      {
        path: joinParamOrMetricFilePath(join('nested', 'params.yaml'), 'test'),
        value: true
      }
    ])
  })
})
