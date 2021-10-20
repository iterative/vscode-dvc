import { join } from 'path'
import { collectFiles } from './collect'
import { ExperimentsRepoJSONOutput } from '../cli/reader'
import complexExperimentsOutput from '../test/fixtures/complex-output-example'

describe('collectFiles', () => {
  it('should collect all of the available files from the test fixture', () => {
    expect(collectFiles(complexExperimentsOutput)).toEqual([
      'params.yaml',
      join('nested', 'params.yaml'),
      'summary.json'
    ])
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
              'further/nested.params.yaml': {},
              'nested/params.yaml': {},
              'params.yaml': {}
            }
          }
        }
      }
    } as ExperimentsRepoJSONOutput

    expect(collectFiles(workspace).sort()).toEqual([
      'further/nested.params.yaml',
      'logs.json',
      'metrics.json',
      'nested/params.yaml',
      'params.yaml',
      'summary.json'
    ])
  })
})
