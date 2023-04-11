import { join } from 'path'
import { collectFiles } from './collect'
import { EXPERIMENT_WORKSPACE_ID } from '../../cli/dvc/contract'
import expShowFixture from '../../test/fixtures/expShow/base/output_'

describe('collectFiles', () => {
  it('should collect all of the available files from the test fixture', () => {
    expect(collectFiles(expShowFixture, [])).toStrictEqual([
      'params.yaml',
      join('nested', 'params.yaml'),
      'summary.json'
    ])
  })

  it('should handle an error being returned', () => {
    const workspaceOnly = [
      {
        error: { msg: 'bad things are happening', type: 'today' },
        rev: EXPERIMENT_WORKSPACE_ID
      }
    ]

    expect(collectFiles(workspaceOnly, [])).toStrictEqual([])
  })

  it('should handle a missing params key', () => {
    const workspaceOnly = [
      {
        data: {
          deps: null,
          meta: { has_checkpoints: false },
          metrics: {
            'logs.json': { data: {} }
          },
          outs: null,
          params: null,
          rev: EXPERIMENT_WORKSPACE_ID,
          timestamp: null
        },
        rev: EXPERIMENT_WORKSPACE_ID
      }
    ]

    expect(collectFiles(workspaceOnly, [])).toStrictEqual(['logs.json'])
  })

  it('should handle a missing metrics key', () => {
    const workspaceOnly = [
      {
        data: {
          deps: null,
          meta: { has_checkpoints: false },
          metrics: null,
          outs: null,
          params: { 'params.yaml': { data: {} } },
          rev: EXPERIMENT_WORKSPACE_ID,
          timestamp: null
        },
        rev: EXPERIMENT_WORKSPACE_ID
      }
    ]

    expect(collectFiles(workspaceOnly, [])).toStrictEqual(['params.yaml'])
  })

  it('should collect all of the available files from a more complex example', () => {
    const workspaceOnly = [
      {
        data: {
          deps: null,
          meta: { has_checkpoints: false },
          metrics: {
            'logs.json': { data: {} },
            'metrics.json': { data: {} },
            'summary.json': { data: {} }
          },
          outs: null,
          params: {
            'further/nested/params.yaml': { data: {} },
            'nested/params.yaml': { data: {} },
            'params.yaml': { data: {} }
          },
          rev: EXPERIMENT_WORKSPACE_ID,
          timestamp: null
        },
        rev: EXPERIMENT_WORKSPACE_ID
      }
    ]

    const files = collectFiles(workspaceOnly, [])
    files.sort()

    expect(files).toStrictEqual([
      'further/nested/params.yaml',
      'logs.json',
      'metrics.json',
      'nested/params.yaml',
      'params.yaml',
      'summary.json'
    ])
  })

  it('should not remove a previously collected file if it is deleted (removal breaks live updates logged by dvclive)', () => {
    const workspaceOnly = [
      {
        data: {
          deps: null,
          meta: { has_checkpoints: false },
          metrics: null,
          outs: null,
          params: {
            'params.yaml': {
              data: {
                epochs: 100
              }
            }
          },
          rev: EXPERIMENT_WORKSPACE_ID,
          timestamp: null
        },
        rev: EXPERIMENT_WORKSPACE_ID
      }
    ]

    expect(collectFiles(workspaceOnly, ['dvclive.json'])).toStrictEqual([
      'params.yaml',
      'dvclive.json'
    ])
  })
})
