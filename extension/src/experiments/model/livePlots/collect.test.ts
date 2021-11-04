import { join } from 'path'
import { collectLivePlotsData } from './collect'
import complexExperimentsOutput from '../../../test/fixtures/complex-output-example'
import complexLivePlotsData from '../../../test/fixtures/complex-live-plots-example'

describe('collectLivePlotsData', () => {
  it('should return the expected data from the test fixture', () => {
    const data = collectLivePlotsData(complexExperimentsOutput)
    expect(data).toEqual(complexLivePlotsData)
  })

  it('should return the correct data given data with no experiments', () => {
    const data = collectLivePlotsData({
      workspace: {
        baseline: {
          data: {
            executor: 'workspace',
            metrics: {
              'summary.json': {
                data: {
                  accuracy: 0.4668000042438507,
                  loss: 1.9293040037155151,
                  val_accuracy: 0.5608000159263611,
                  val_loss: 1.8770883083343506
                }
              }
            },
            params: {
              'params.yaml': {
                data: {
                  dropout: 0.122,
                  dvc_logs_dir: 'dvc_logs',
                  epochs: 2,
                  learning_rate: 2.2e-7,
                  log_file: 'logs.csv',
                  process: { test_arg: 'string', threshold: 0.86 }
                }
              },
              [join('nested', 'params.yaml')]: {
                data: {
                  test: true
                }
              }
            },
            queued: false,
            running: true,
            timestamp: null
          }
        }
      }
    })
    expect(data).toEqual([
      {
        title: 'metrics:summary.json:accuracy',
        values: []
      },
      {
        title: 'metrics:summary.json:loss',
        values: []
      },
      {
        title: 'metrics:summary.json:val_accuracy',
        values: []
      },
      {
        title: 'metrics:summary.json:val_loss',
        values: []
      }
    ])
  })
})
