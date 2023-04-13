import { collectExperiments } from './collect'
import { EXPERIMENT_WORKSPACE_ID } from '../../cli/dvc/contract'
import { COMMITS_SEPARATOR } from '../../cli/git/constants'

describe('collectExperiments', () => {
  it('should return an empty array if no commits are present', () => {
    const { commits } = collectExperiments(
      {
        [EXPERIMENT_WORKSPACE_ID]: {
          baseline: {}
        }
      },
      false,
      ''
    )
    expect(commits).toStrictEqual([])
  })

  const repoWithTwoCommits = {
    [EXPERIMENT_WORKSPACE_ID]: {
      baseline: {}
    },
    commitA: {
      baseline: { data: { name: 'branchA' } },
      otherExp1: { data: {} },
      otherExp2: {
        data: { checkpoint_tip: 'otherExp2' }
      },
      otherExp2_1: {
        data: { checkpoint_tip: 'otherExp2' }
      }
    },
    commitB: {
      baseline: { data: { name: 'branchB' } }
    }
  }

  it('should define a workspace', () => {
    const { workspace } = collectExperiments(repoWithTwoCommits, false, '')

    expect(workspace).toBeDefined()
  })

  it('should find two branches from a repo with two branches', () => {
    const { commits } = collectExperiments(repoWithTwoCommits, false, '')

    expect(commits.length).toStrictEqual(2)
  })

  it('should list commits in the same order as they are collected', () => {
    const { commits } = collectExperiments(repoWithTwoCommits, false, '')
    const [commitA, commitB] = commits

    expect(commitA.id).toStrictEqual('branchA')
    expect(commitB.id).toStrictEqual('branchB')
  })

  it('should find two experiments on commitA', () => {
    const { experimentsByCommit } = collectExperiments(
      repoWithTwoCommits,
      false,
      ''
    )
    expect(experimentsByCommit.get('branchA')?.length).toStrictEqual(2)
  })

  it('should find no experiments on branchB', () => {
    const { experimentsByCommit } = collectExperiments(
      repoWithTwoCommits,
      false,
      ''
    )
    expect(experimentsByCommit.get('branchB')).toBeUndefined()
  })

  it('should add data from git to commits if git log output is provided', () => {
    const { commits } = collectExperiments(
      {
        [EXPERIMENT_WORKSPACE_ID]: {
          baseline: {}
        },
        a123: {
          baseline: { data: {} }
        },
        b123: {
          baseline: { data: {} }
        }
      },
      false,
      `a123\nJohn Smith\n3 days ago\nrefNames:tag: v.1.1\nmessage:add new feature${COMMITS_SEPARATOR}b123\nrenovate[bot]\n5 weeks ago\nrefNames:\nmessage:update various dependencies\n* update dvc\n* update dvclive`
    )
    const [branch1, branch2] = commits
    expect(branch1.displayName).toStrictEqual('add new feature')
    expect(branch2.displayName).toStrictEqual('update various dependencies ...')
    expect(branch1.commit).toStrictEqual({
      author: 'John Smith',
      date: '3 days ago',
      message: 'add new feature',
      tags: ['v.1.1']
    })
    expect(branch2.commit).toStrictEqual({
      author: 'renovate[bot]',
      date: '5 weeks ago',
      message: 'update various dependencies\n* update dvc\n* update dvclive',
      tags: []
    })
  })

  const repoWithNestedCheckpoints = {
    [EXPERIMENT_WORKSPACE_ID]: { baseline: {} },
    branchA: {
      baseline: { data: {} },
      tip1: {
        data: { checkpoint_tip: 'tip1', name: 'tip1' }
      },
      tip1cp1: {
        data: { checkpoint_tip: 'tip1' }
      },
      tip1cp2: {
        data: { checkpoint_tip: 'tip1' }
      },
      tip1cp3: {
        data: { checkpoint_tip: 'tip1' }
      }
    }
  }

  it('should only list the tip as a top-level experiment', () => {
    const { experimentsByCommit } = collectExperiments(
      repoWithNestedCheckpoints,
      false,
      ''
    )
    expect(experimentsByCommit.size).toStrictEqual(1)
  })
})
