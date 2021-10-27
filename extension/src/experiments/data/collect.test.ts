import { join } from 'path'
import { collectFiles } from './collect'
import { ExperimentsRepoJSONOutput } from '../../cli/reader'
import complexExperimentsOutput from '../../test/fixtures/complex-output-example'

describe('collectFiles', () => {
  it('should collect all of the available files from the test fixture', () => {
    expect(collectFiles(complexExperimentsOutput)).toEqual([
      'params.yaml',
      join('nested', 'params.yaml'),
      'summary.json'
    ])
  })

  it('should handle an error being returned', () => {
    const workspace = {
      workspace: {
        baseline: {
          error: { msg: 'bad things are happening', type: 'today' }
        }
      }
    }

    expect(collectFiles(workspace)).toEqual([])
  })

  it('should handle a missing params key', () => {
    const workspace = {
      workspace: {
        baseline: {
          data: {
            metrics: {
              'logs.json': {}
            }
          }
        }
      }
    }

    expect(collectFiles(workspace)).toEqual(['logs.json'])
  })

  it('should handle a missing metrics key', () => {
    const workspace = {
      workspace: {
        baseline: {
          data: {
            params: {
              'params.yaml': {}
            }
          }
        }
      }
    }

    expect(collectFiles(workspace)).toEqual(['params.yaml'])
  })

  it('should collect all of the available files from a more complex example', () => {
    const workspace = {
      workspace: {
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
    } as ExperimentsRepoJSONOutput

    expect(collectFiles(workspace).sort()).toEqual([
      'further/nested/params.yaml',
      'logs.json',
      'metrics.json',
      'nested/params.yaml',
      'params.yaml',
      'summary.json'
    ])
  })
})
