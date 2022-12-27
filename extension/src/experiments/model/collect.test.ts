import { collectExperiments, collectMutableRevisions } from './collect'
import { Experiment } from '../webview/contract'
import modifiedFixture from '../../test/fixtures/expShow/modified/output'
import {
  ExperimentStatus,
  EXPERIMENT_WORKSPACE_ID
} from '../../cli/dvc/contract'

const mockedGetCommit = jest.mocked(() => Promise.resolve('commit message'))

describe('collectExperiments', () => {
  it('should return an empty array if no branches are present', async () => {
    const { branches } = await collectExperiments(
      {
        [EXPERIMENT_WORKSPACE_ID]: {
          baseline: {}
        }
      },
      false,
      mockedGetCommit
    )
    expect(branches).toStrictEqual([])
  })

  const repoWithTwoBranches = {
    [EXPERIMENT_WORKSPACE_ID]: {
      baseline: {}
    },
    branchA: {
      baseline: { data: { name: 'branchA' } },
      otherExp1: { data: {} },
      otherExp2: {
        data: { checkpoint_tip: 'otherExp2' }
      },
      otherExp2_1: {
        data: { checkpoint_tip: 'otherExp2' }
      }
    },
    branchB: {
      baseline: { data: { name: 'branchB' } }
    }
  }

  it('should define a workspace', async () => {
    const { workspace } = await collectExperiments(
      repoWithTwoBranches,
      false,
      mockedGetCommit
    )

    expect(workspace).toBeDefined()
  })

  it('should find two branches from a repo with two branches', async () => {
    const { branches } = await collectExperiments(
      repoWithTwoBranches,
      false,
      mockedGetCommit
    )

    expect(branches.length).toStrictEqual(2)
  })

  it('should list branches in the same order as they are collected', async () => {
    const { branches } = await collectExperiments(
      repoWithTwoBranches,
      false,
      mockedGetCommit
    )
    const [branchA, branchB] = branches

    expect(branchA.id).toStrictEqual('branchA')
    expect(branchB.id).toStrictEqual('branchB')
  })

  it('should find two experiments on branchA', async () => {
    const { experimentsByBranch } = await collectExperiments(
      repoWithTwoBranches,
      false,
      mockedGetCommit
    )
    expect(experimentsByBranch.get('branchA')?.length).toStrictEqual(2)
  })

  it('should find no experiments on branchB', async () => {
    const { experimentsByBranch } = await collectExperiments(
      repoWithTwoBranches,
      false,
      mockedGetCommit
    )
    expect(experimentsByBranch.get('branchB')).toBeUndefined()
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

  it('should only list the tip as a top-level experiment', async () => {
    const { experimentsByBranch } = await collectExperiments(
      repoWithNestedCheckpoints,
      false,
      mockedGetCommit
    )
    expect(experimentsByBranch.size).toStrictEqual(1)
  })

  it('should find three checkpoints on the tip', async () => {
    const { checkpointsByTip } = await collectExperiments(
      repoWithNestedCheckpoints,
      false,
      mockedGetCommit
    )
    const checkpoints = checkpointsByTip.get('tip1') as Experiment[]

    expect(checkpoints?.length).toStrictEqual(3)
  })

  it('should find checkpoints in the correct order', async () => {
    const { checkpointsByTip } = await collectExperiments(
      repoWithNestedCheckpoints,
      false,
      mockedGetCommit
    )
    const checkpoints = checkpointsByTip.get('tip1') as Experiment[]
    const [tip1cp1, tip1cp2, tip1cp3] = checkpoints
    expect(tip1cp1.id).toStrictEqual('tip1cp1')
    expect(tip1cp2.id).toStrictEqual('tip1cp2')
    expect(tip1cp3.id).toStrictEqual('tip1cp3')
  })

  it('should handle the continuation of a modified checkpoint', async () => {
    const { checkpointsByTip } = await collectExperiments(
      modifiedFixture,
      false,
      mockedGetCommit
    )

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

  it('should handle a checkpoint tip not having a name', async () => {
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
    const acc = await collectExperiments(
      repoWithNestedCheckpoints,
      false,
      mockedGetCommit
    )

    const { experimentsByBranch, checkpointsByTip } = acc
    const [experiment] = experimentsByBranch.get('branchA') || []

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
