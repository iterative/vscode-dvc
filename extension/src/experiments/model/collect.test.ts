import { collectExperiments } from './collect'
import { EXPERIMENT_WORKSPACE_ID } from '../../cli/dvc/contract'
import { COMMITS_SEPARATOR } from '../../cli/git/constants'
import {
  generateCommitWithExperiments,
  generateTestExpState,
  generateWorkspaceOnlyExpShowOutput
} from '../../test/util'

describe('collectExperiments', () => {
  it('should return an empty array if no commits are present', () => {
    const { commits } = collectExperiments(
      generateWorkspaceOnlyExpShowOutput(),
      false,
      ''
    )
    expect(commits).toStrictEqual([])
  })

  const expShowWithTwoCommits = [
    generateTestExpState(EXPERIMENT_WORKSPACE_ID),
    {
      ...generateCommitWithExperiments(
        '61bed4ce8913eca7f73ca754d65bc5daad1520e2',
        {},
        [{}, {}]
      ),
      name: 'branchA'
    },
    {
      ...generateTestExpState('351e42ace3cb6a3a853c65bef285e60748cc6341'),
      name: 'branchB'
    }
  ]

  it('should define a workspace', () => {
    const { workspace } = collectExperiments(expShowWithTwoCommits, false, '')

    expect(workspace).toBeDefined()
  })

  it('should find two branches from a repo with two branches', () => {
    const { commits } = collectExperiments(expShowWithTwoCommits, false, '')

    expect(commits.length).toStrictEqual(2)
  })

  it('should list commits in the same order as they are collected', () => {
    const { commits } = collectExperiments(expShowWithTwoCommits, false, '')
    const [commitA, commitB] = commits

    expect(commitA.id).toStrictEqual('branchA')
    expect(commitB.id).toStrictEqual('branchB')
  })

  it('should find two experiments on commitA', () => {
    const { experimentsByCommit } = collectExperiments(
      expShowWithTwoCommits,
      false,
      ''
    )
    expect(experimentsByCommit.get('branchA')?.length).toStrictEqual(2)
  })

  it('should find no experiments on branchB', () => {
    const { experimentsByCommit } = collectExperiments(
      expShowWithTwoCommits,
      false,
      ''
    )
    expect(experimentsByCommit.get('branchB')).toBeUndefined()
  })

  it('should add data from git to commits if git log output is provided', () => {
    const { commits } = collectExperiments(
      expShowWithTwoCommits,
      false,
      `61bed4ce8913eca7f73ca754d65bc5daad1520e2\nJohn Smith\n3 days ago\nrefNames:tag: v.1.1\nmessage:add new feature${COMMITS_SEPARATOR}351e42ace3cb6a3a853c65bef285e60748cc6341\nrenovate[bot]\n5 weeks ago\nrefNames:\nmessage:update various dependencies\n* update dvc\n* update dvclive`
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
})
