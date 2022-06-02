import { join } from 'path'
import { collectFlatExperimentParams } from './collect'
import rowsFixture from '../../../test/fixtures/expShow/rows'
import { appendColumnToPath } from '../../columns/paths'

describe('collectFlatExperimentParams', () => {
  it('should flatten the params into an array', () => {
    const params = collectFlatExperimentParams(rowsFixture[0].params)
    expect(params).toStrictEqual([
      { path: appendColumnToPath('params.yaml', 'code_names'), value: [0, 1] },
      { path: appendColumnToPath('params.yaml', 'epochs'), value: 2 },
      {
        path: appendColumnToPath('params.yaml', 'learning_rate'),
        value: 2.2e-7
      },
      {
        path: appendColumnToPath('params.yaml', 'dvc_logs_dir'),
        value: 'dvc_logs'
      },
      {
        path: appendColumnToPath('params.yaml', 'log_file'),
        value: 'logs.csv'
      },
      {
        path: appendColumnToPath('params.yaml', 'dropout'),
        value: 0.122
      },
      {
        path: appendColumnToPath('params.yaml', 'process', 'threshold'),
        value: 0.86
      },
      {
        path: appendColumnToPath('params.yaml', 'process', 'test_arg'),
        value: 'string'
      },
      {
        path: appendColumnToPath(join('nested', 'params.yaml'), 'test'),
        value: true
      }
    ])
  })
})
