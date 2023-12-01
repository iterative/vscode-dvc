import { join } from 'path'
import { collectFlatExperimentParams } from './collect'
import rowsFixture from '../../../test/fixtures/expShow/base/rows'
import { appendColumnToPath } from '../../columns/paths'

describe('collectFlatExperimentParams', () => {
  it('should flatten the params into an array', () => {
    const params = collectFlatExperimentParams(rowsFixture[0].params)
    expect(params).toStrictEqual([
      {
        path: appendColumnToPath('params.yaml', 'code_names'),
        value: [0, 1]
      },
      {
        path: appendColumnToPath('params.yaml', 'epochs'),
        value: 5
      },
      {
        path: appendColumnToPath('params.yaml', 'learning_rate'),
        value: 2.1e-7
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
        value: 0.124
      },
      {
        path: appendColumnToPath('params.yaml', 'process'),
        value: undefined
      },
      {
        path: appendColumnToPath('params.yaml', 'process', 'threshold'),
        value: 0.85
      },
      {
        path: appendColumnToPath(join('nested', 'params.yaml'), 'test'),
        value: true
      }
    ])
  })

  it('should return nested params in the final list', () => {
    const params = collectFlatExperimentParams({
      'params.yaml': {
        data_path: 'fra.txt',
        model: {
          batch_size: 512,
          duration: '00:00:30:00',
          latent_dim: 8,
          max_epochs: 2,
          optim: {
            lr: 0.01
          }
        },
        num_samples: 10000,
        seed: 423
      },
      'results/params.yaml': {
        latent_dim: 8,
        optim_params: {
          lr: 0.01
        }
      }
    })

    expect(params).toStrictEqual([
      { path: 'params.yaml:data_path', value: 'fra.txt' },
      { path: 'params.yaml:model', value: undefined },
      { path: 'params.yaml:model.batch_size', value: 512 },
      { path: 'params.yaml:model.duration', value: '00:00:30:00' },
      { path: 'params.yaml:model.latent_dim', value: 8 },
      { path: 'params.yaml:model.max_epochs', value: 2 },
      { path: 'params.yaml:model.optim', value: undefined },
      { path: 'params.yaml:model.optim.lr', value: 0.01 },
      { path: 'params.yaml:num_samples', value: 10000 },
      { path: 'params.yaml:seed', value: 423 },
      { path: 'results/params.yaml:latent_dim', value: 8 },
      { path: 'results/params.yaml:optim_params', value: undefined },
      { path: 'results/params.yaml:optim_params.lr', value: 0.01 }
    ])
  })

  it('should omit the file from the param paths when only params.yaml is present', () => {
    const params = collectFlatExperimentParams({
      'params.yaml': {
        model: {
          batch_size: 512,
          duration: '00:00:30:00',
          optim: {
            lr: 0.01
          }
        },
        num_samples: 10000,
        seed: 423
      }
    })
    expect(params).toStrictEqual([
      { path: 'model', value: undefined },
      { path: 'model.batch_size', value: 512 },
      { path: 'model.duration', value: '00:00:30:00' },
      { path: 'model.optim', value: undefined },
      { path: 'model.optim.lr', value: 0.01 },
      { path: 'num_samples', value: 10000 },
      { path: 'seed', value: 423 }
    ])
  })
})
