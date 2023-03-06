import { join } from 'path'
import { collectFiles } from './collect'
import {
  ExperimentsOutput,
  ExperimentStatus,
  EXPERIMENT_WORKSPACE_ID
} from '../../cli/dvc/contract'
import expShowFixture from '../../test/fixtures/expShow/base/output'

describe('collectFiles', () => {
  it('should collect all of the available files from the test fixture', () => {
    expect(collectFiles(expShowFixture, [])).toStrictEqual([
      'params.yaml',
      join('nested', 'params.yaml'),
      'summary.json',
      join('data', 'data.xml'),
      join('src', 'prepare.py'),
      join('data', 'prepared'),
      join('src', 'featurization.py'),
      join('data', 'features'),
      join('src', 'train.py'),
      'model.pkl',
      join('src', 'evaluate.py')
    ])
  })

  it('should handle an error being returned', () => {
    const workspace = {
      [EXPERIMENT_WORKSPACE_ID]: {
        baseline: {
          error: { msg: 'bad things are happening', type: 'today' }
        }
      }
    }

    expect(collectFiles(workspace, [])).toStrictEqual([])
  })

  it('should handle missing params and deps key', () => {
    const workspace = {
      [EXPERIMENT_WORKSPACE_ID]: {
        baseline: {
          data: {
            metrics: {
              'logs.json': {}
            }
          }
        }
      }
    }

    expect(collectFiles(workspace, [])).toStrictEqual(['logs.json'])
  })

  it('should handle missing metrics and deps keys', () => {
    const workspace = {
      [EXPERIMENT_WORKSPACE_ID]: {
        baseline: {
          data: {
            params: {
              'params.yaml': {}
            }
          }
        }
      }
    }

    expect(collectFiles(workspace, [])).toStrictEqual(['params.yaml'])
  })

  it('should handle missing metrics and params keys', () => {
    const workspace = {
      [EXPERIMENT_WORKSPACE_ID]: {
        baseline: {
          data: {
            deps: {
              'data.json': {
                hash: '22a1a2931c8370d3aeedd7183606fd7f',
                nfiles: null,
                size: 14445097
              }
            }
          }
        }
      }
    }

    expect(collectFiles(workspace, [])).toStrictEqual(['data.json'])
  })

  it('should handle none of the expected keys being present', () => {
    const workspace = {
      [EXPERIMENT_WORKSPACE_ID]: {
        baseline: {
          data: {}
        }
      }
    }

    expect(collectFiles(workspace, [])).toStrictEqual([])
  })

  it('should collect all of the available files from a more complex example', () => {
    const workspace = {
      [EXPERIMENT_WORKSPACE_ID]: {
        baseline: {
          data: {
            metrics: {
              'logs.json': {},
              'metrics.json': {},
              'summary.json': {}
            },
            params: {
              'further/nested/params.yaml': {},
              'nested/params.yaml': {},
              'params.yaml': {}
            }
          }
        }
      }
    } as ExperimentsOutput

    expect(collectFiles(workspace, []).sort()).toStrictEqual([
      'further/nested/params.yaml',
      'logs.json',
      'metrics.json',
      'nested/params.yaml',
      'params.yaml',
      'summary.json'
    ])
  })

  it('should not remove a previously collected file if it is deleted (removal breaks live updates logged by dvclive)', () => {
    const workspace = {
      [EXPERIMENT_WORKSPACE_ID]: {
        baseline: {
          data: {
            executor: EXPERIMENT_WORKSPACE_ID,
            metrics: {},
            params: {
              'params.yaml': {
                data: {
                  epochs: 100
                }
              }
            },
            status: ExperimentStatus.RUNNING,
            timestamp: null
          }
        }
      }
    } as ExperimentsOutput

    expect(collectFiles(workspace, ['dvclive.json'])).toStrictEqual([
      'params.yaml',
      'dvclive.json'
    ])
  })
})
