import { collectExperiments, collectMutableRevisions } from './collect'
import { Experiment } from '../webview/contract'
import modifiedFixture from '../../test/fixtures/expShow/modified/output'
import {
  ExperimentStatus,
  EXPERIMENT_WORKSPACE_ID
} from '../../cli/dvc/contract'
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
    expect(branch1.displayNameOrParent).toStrictEqual('add new feature')
    expect(branch2.displayNameOrParent).toStrictEqual(
      'update various dependencies ...'
    )
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

  it('should find three checkpoints on the tip', () => {
    const { checkpointsByTip } = collectExperiments(
      repoWithNestedCheckpoints,
      false,
      ''
    )
    const checkpoints = checkpointsByTip.get('tip1') as Experiment[]

    expect(checkpoints?.length).toStrictEqual(3)
  })

  it('should find checkpoints in the correct order', () => {
    const { checkpointsByTip } = collectExperiments(
      repoWithNestedCheckpoints,
      false,
      ''
    )
    const checkpoints = checkpointsByTip.get('tip1') as Experiment[]
    const [tip1cp1, tip1cp2, tip1cp3] = checkpoints
    expect(tip1cp1.id).toStrictEqual('tip1cp1')
    expect(tip1cp2.id).toStrictEqual('tip1cp2')
    expect(tip1cp3.id).toStrictEqual('tip1cp3')
  })

  it('should handle the continuation of a modified checkpoint', () => {
    const { checkpointsByTip } = collectExperiments(modifiedFixture, false, '')

    const modifiedCheckpointTip = checkpointsByTip
      .get('exp-01b3a')
      ?.filter(checkpoint => checkpoint.displayNameOrParent?.includes('('))

    expect(modifiedCheckpointTip).toHaveLength(1)
    expect(modifiedCheckpointTip?.[0].displayNameOrParent).toStrictEqual(
      '(3b0c6ac)'
    )
    expect(modifiedCheckpointTip?.[0].label).toStrictEqual('7e3cb21')

    const modifiedCheckpoint = checkpointsByTip
      .get('exp-9bc1b')
      ?.filter(checkpoint => checkpoint.displayNameOrParent?.includes('('))

    expect(modifiedCheckpoint).toHaveLength(1)
    expect(modifiedCheckpoint?.[0].displayNameOrParent).toStrictEqual(
      '(df39067)'
    )
    expect(modifiedCheckpoint?.[0].label).toStrictEqual('98cb38c')

    for (const checkpoints of checkpointsByTip.values()) {
      const continuationCheckpoints = checkpoints.filter(checkpoint => {
        const { label, displayNameOrParent } = checkpoint
        return (
          displayNameOrParent?.includes('(') &&
          !(label === '7e3cb21' && displayNameOrParent === '(3b0c6ac)') &&
          !(label === '98cb38c' && displayNameOrParent === '(df39067)')
        )
      })
      expect(continuationCheckpoints).toHaveLength(0)
    }
  })

  it('should handle a checkpoint tip not having a name', () => {
    const checkpointTipWithoutAName = '3fceabdcef3c7b97c7779f8ae0c69a5542eefaf5'

    const repoWithNestedCheckpoints = {
      [EXPERIMENT_WORKSPACE_ID]: { baseline: {} },
      branchA: {
        baseline: { data: {} },
        [checkpointTipWithoutAName]: {
          data: { checkpoint_tip: checkpointTipWithoutAName }
        },
        tip1cp1: {
          data: { checkpoint_tip: checkpointTipWithoutAName }
        },
        tip1cp2: {
          data: { checkpoint_tip: checkpointTipWithoutAName }
        },
        tip1cp3: {
          data: { checkpoint_tip: checkpointTipWithoutAName }
        }
      }
    }
    const acc = collectExperiments(repoWithNestedCheckpoints, false, '')

    const { experimentsByCommit, checkpointsByTip } = acc
    const [experiment] = experimentsByCommit.get('branchA') || []

    expect(experiment.id).toStrictEqual(checkpointTipWithoutAName)
    expect(
      checkpointsByTip.get(checkpointTipWithoutAName)?.length
    ).toStrictEqual(3)
  })
})

describe('collectMutableRevisions', () => {
  const baseExperiments = [
    { label: 'branch-A', selected: false, status: ExperimentStatus.SUCCESS },
    {
      label: EXPERIMENT_WORKSPACE_ID,
      selected: false,
      status: ExperimentStatus.FAILED
    }
  ] as Experiment[]

  it('should return the workspace when there is an unselected running checkpoint experiment', () => {
    const experiments = [
      {
        label: 'exp-123',
        selected: false,
        status: ExperimentStatus.RUNNING
      },
      ...baseExperiments
    ] as Experiment[]

    const mutableRevisions = collectMutableRevisions(experiments, true)
    expect(mutableRevisions).toStrictEqual([EXPERIMENT_WORKSPACE_ID])
  })

  it('should return the workspace when there are no checkpoints', () => {
    const experiments = [
      { label: 'branch-A', selected: false, status: ExperimentStatus.SUCCESS },
      {
        label: EXPERIMENT_WORKSPACE_ID,
        selected: false,
        status: ExperimentStatus.SUCCESS
      }
    ] as Experiment[]

    const mutableRevisions = collectMutableRevisions(experiments, false)
    expect(mutableRevisions).toStrictEqual([EXPERIMENT_WORKSPACE_ID])
  })

  it('should return all running experiments when there are checkpoints', () => {
    const experiments = [
      { label: 'branch-A', selected: false, status: ExperimentStatus.SUCCESS },
      {
        label: EXPERIMENT_WORKSPACE_ID,
        selected: false,
        status: ExperimentStatus.SUCCESS
      },
      { label: 'running-1', selected: false, status: ExperimentStatus.RUNNING },
      { label: 'running-2', selected: true, status: ExperimentStatus.RUNNING }
    ] as Experiment[]

    const mutableRevisions = collectMutableRevisions(experiments, false)
    expect(mutableRevisions).toStrictEqual([
      EXPERIMENT_WORKSPACE_ID,
      'running-1',
      'running-2'
    ])
  })
})
