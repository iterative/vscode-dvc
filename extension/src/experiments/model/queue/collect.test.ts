import { collectFlatExperimentParams } from './collect'
import rowsFixture from '../../../test/fixtures/expShow/rows'

describe('flattenExperimentParams', () => {
  it('should do the thing', () => {
    const params = collectFlatExperimentParams(rowsFixture[0].params)
    expect(params).toEqual([
      { path: 'params.yaml:epochs', value: 2 },
      { path: 'params.yaml:learning_rate', value: 2.2e-7 },
      { path: 'params.yaml:dvc_logs_dir', value: 'dvc_logs' },
      { path: 'params.yaml:log_file', value: 'logs.csv' },
      { path: 'params.yaml:dropout', value: 0.122 },
      { path: 'params.yaml:process.threshold', value: 0.86 },
      { path: 'params.yaml:process.test_arg', value: 'string' },
      { path: 'nested/params.yaml:test', value: true }
    ])
  })
})
