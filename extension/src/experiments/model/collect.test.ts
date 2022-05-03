import { collectExperiments, collectMutableRevisions } from './collect'
import { Experiment } from '../webview/contract'
import modifiedFixture from '../../test/fixtures/expShow/modified'

describe('collectExperiments', () => {
  it('should return an empty array if no branches are present', () => {
    const { branches } = collectExperiments({
      workspace: {
        baseline: {}
      }
    })
    expect(branches).toStrictEqual([])
  })

  const repoWithTwoBranches = {
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
    },
    workspace: {
      baseline: {}
    }
  }
  const { branches, experimentsByBranch, workspace } =
    collectExperiments(repoWithTwoBranches)

  it('should define a workspace', () => {
    expect(workspace).toBeDefined()
  })

  it('should find two branches from a repo with two branches', () => {
    expect(branches.length).toStrictEqual(2)
  })

  const [branchA, branchB] = branches
  it('should list branches in the same order as they are collected', () => {
    expect(branchA.id).toStrictEqual('branchA')
    expect(branchB.id).toStrictEqual('branchB')
  })

  it('should find two experiments on branchA', () => {
    expect(experimentsByBranch.get('branchA')?.length).toStrictEqual(2)
  })

  it('should find no experiments on branchB', () => {
    expect(experimentsByBranch.get('branchB')).toBeUndefined()
  })

  const repoWithNestedCheckpoints = {
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
    },
    workspace: { baseline: {} }
  }
  const acc = collectExperiments(repoWithNestedCheckpoints)

  it('should only list the tip as a top-level experiment', () => {
    const { experimentsByBranch } = acc
    expect(experimentsByBranch.size).toStrictEqual(1)
  })

  const checkpoints = acc.checkpointsByTip.get('tip1') as Experiment[]

  it('should find three checkpoints on the tip', () => {
    expect(checkpoints?.length).toStrictEqual(3)
  })
  const [tip1cp1, tip1cp2, tip1cp3] = checkpoints

  it('should find checkpoints in the correct order', () => {
    expect(tip1cp1.id).toStrictEqual('tip1cp1')
    expect(tip1cp2.id).toStrictEqual('tip1cp2')
    expect(tip1cp3.id).toStrictEqual('tip1cp3')
  })

  it('should handle the continuation of a modified checkpoint', () => {
    const { checkpointsByTip } = collectExperiments(modifiedFixture)

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
})

describe('collectMutableRevisions', () => {
  const baseExperiments = [
    { label: 'branch-A', running: false, selected: false },
    { label: 'workspace', running: false, selected: false }
  ] as Experiment[]

  it('should not return the workspace when there is a selected running checkpoint experiment (race condition)', () => {
    const experiments = [
      {
        label: 'exp-123',
        running: true,
        selected: true
      },
      ...baseExperiments
    ] as Experiment[]

    const mutableRevisions = collectMutableRevisions(experiments, true)
    expect(mutableRevisions).toStrictEqual([])
  })

  it('should return the workspace when there is an unselected running checkpoint experiment', () => {
    const experiments = [
      {
        label: 'exp-123',
        running: true,
        selected: false
      },
      ...baseExperiments
    ] as Experiment[]

    const mutableRevisions = collectMutableRevisions(experiments, true)
    expect(mutableRevisions).toStrictEqual(['workspace'])
  })

  it('should return the workspace when there are no checkpoints', () => {
    const experiments = [
      { label: 'branch-A', running: false, selected: false },
      { label: 'workspace', running: false, selected: false }
    ] as Experiment[]

    const mutableRevisions = collectMutableRevisions(experiments, false)
    expect(mutableRevisions).toStrictEqual(['workspace'])
  })

  it('should return all running experiments when there are checkpoints', () => {
    const experiments = [
      { label: 'branch-A', running: false, selected: false },
      { label: 'workspace', running: false, selected: false },
      { label: 'running-1', running: true, selected: false },
      { label: 'running-2', running: true, selected: true }
    ] as Experiment[]

    const mutableRevisions = collectMutableRevisions(experiments, false)
    expect(mutableRevisions).toStrictEqual([
      'workspace',
      'running-1',
      'running-2'
    ])
  })
})
