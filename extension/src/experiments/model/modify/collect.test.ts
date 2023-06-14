import { join } from 'path'
import { collectFlatExperimentParams } from './collect'
import rowsFixture from '../../../test/fixtures/expShow/base/rows'
import { appendColumnToPath } from '../../columns/paths'

describe('collectFlatExperimentParams', () => {
  it('should flatten the params into an array', () => {
    const params = collectFlatExperimentParams(rowsFixture[0].params)
    expect(params).toStrictEqual([
      {
        isString: false,
        path: appendColumnToPath('params.yaml', 'code_names'),
        value: [0, 1]
      },
      {
        isString: false,
        path: appendColumnToPath('params.yaml', 'epochs'),
        value: 5
      },
      {
        isString: false,
        path: appendColumnToPath('params.yaml', 'learning_rate'),
        value: 2.1e-7
      },
      {
        isString: true,
        path: appendColumnToPath('params.yaml', 'dvc_logs_dir'),
        value: 'dvc_logs'
      },
      {
        isString: true,
        path: appendColumnToPath('params.yaml', 'log_file'),
        value: 'logs.csv'
      },
      {
        isString: false,
        path: appendColumnToPath('params.yaml', 'dropout'),
        value: 0.124
      },
      {
        isString: false,
        path: appendColumnToPath('params.yaml', 'process', 'threshold'),
        value: 0.85
      },
      {
        isString: false,
        path: appendColumnToPath(join('nested', 'params.yaml'), 'test'),
        value: true
      }
    ])
  })
})
