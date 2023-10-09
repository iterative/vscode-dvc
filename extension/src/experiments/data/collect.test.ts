import { join } from 'path'
import { collectBranches, collectFiles } from './collect'
import { EXPERIMENT_WORKSPACE_ID } from '../../cli/dvc/contract'
import expShowFixture from '../../test/fixtures/expShow/base/output'
import { generateTestExpShowOutput } from '../../test/util/experiments'

describe('collectFiles', () => {
  it('should collect all of the available files from the test fixture', () => {
    const files = collectFiles(expShowFixture, [])
    files.sort()

    expect(files).toStrictEqual([
      join('data', 'data.xml'),
      join('data', 'features'),
      join('data', 'prepared'),
      'metrics.json',
      'model.pkl',
      join('nested', 'params.yaml'),
      'params.yaml',
      join('src', 'evaluate.py'),
      join('src', 'featurization.py'),
      join('src', 'prepare.py'),
      join('src', 'train.py'),
      'summary.json'
    ])
  })

  it('should handle an error being returned', () => {
    const workspaceOnly = [
      {
        branch: 'main',
        error: { msg: 'bad things are happening', type: 'today' },
        rev: EXPERIMENT_WORKSPACE_ID
      }
    ]

    expect(collectFiles(workspaceOnly, [])).toStrictEqual([])
  })

  it('should handle a missing params key', () => {
    const workspaceOnly = generateTestExpShowOutput({
      metrics: {
        'logs.json': { data: {} }
      }
    })
    expect(collectFiles(workspaceOnly, [])).toStrictEqual(['logs.json'])
  })

  it('should handle a missing metrics key', () => {
    const workspaceOnly = generateTestExpShowOutput({
      params: { 'params.yaml': { data: {} } }
    })

    expect(collectFiles(workspaceOnly, [])).toStrictEqual(['params.yaml'])
  })

  it('should collect all of the available files from a more complex example', () => {
    const workspaceOnly = generateTestExpShowOutput({
      metrics: {
        'logs.json': { data: {} },
        'metrics.json': { data: {} },
        'summary.json': { data: {} }
      },
      params: {
        'further/nested/params.yaml': { data: {} },
        'nested/params.yaml': { data: {} },
        'params.yaml': { data: {} }
      }
    })

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
    const workspaceOnly = generateTestExpShowOutput({
      params: {
        'params.yaml': {
          data: {
            epochs: 100
          }
        }
      }
    })

    const files = collectFiles(workspaceOnly, ['dvclive.json'])
    files.sort()

    expect(collectFiles(workspaceOnly, ['dvclive.json'])).toStrictEqual([
      'dvclive.json',
      'params.yaml'
    ])
  })
})

describe('collectBranches', () => {
  it('should correctly parse the git branch output', () => {
    const { branches, branchesToSelect, currentBranch } = collectBranches([
      '* main',
      'exp-12',
      'fix-bug-11',
      'other'
    ])

    expect(branches).toStrictEqual(['main', 'exp-12', 'fix-bug-11', 'other'])
    expect(branchesToSelect).toStrictEqual(['exp-12', 'fix-bug-11', 'other'])
    expect(currentBranch).toStrictEqual('main')
  })

  it('should correct parse a detached head branch', () => {
    const { branches, branchesToSelect, currentBranch } = collectBranches([
      '* (HEAD detached at 201a9a5)',
      'exp-12',
      'fix-bug-11',
      'other'
    ])

    expect(branchesToSelect).toStrictEqual(['exp-12', 'fix-bug-11', 'other'])
    expect(branches).toStrictEqual([
      '(HEAD detached at 201a9a5)',
      'exp-12',
      'fix-bug-11',
      'other'
    ])
    expect(currentBranch).toStrictEqual('(HEAD detached at 201a9a5)')
  })

  it('should correct parse a "no-branch" output', () => {
    const { branches, currentBranch, branchesToSelect } = collectBranches([
      'exp-12',
      '* (no-branch)',
      'fix-bug-11',
      'other'
    ])

    expect(branches).toStrictEqual([
      'exp-12',
      '(no-branch)',
      'fix-bug-11',
      'other'
    ])
    expect(currentBranch).toStrictEqual('(no-branch)')
    expect(branchesToSelect).toStrictEqual(['exp-12', 'fix-bug-11', 'other'])
  })
})
