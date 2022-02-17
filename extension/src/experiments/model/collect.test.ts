import { collectExperiments, collectStatuses } from './collect'
import { Experiment } from '../webview/contract'
import modifiedFixture from '../../test/fixtures/expShow/modified'

describe('collectExperiments', () => {
  it('should return an empty array if no branches are present', () => {
    const { branches } = collectExperiments({
      workspace: {
        baseline: {}
      }
    })
    expect(branches).toEqual([])
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
    expect(branches.length).toEqual(2)
  })

  const [branchA, branchB] = branches
  it('should list branches in the same order as they are collected', () => {
    expect(branchA.id).toEqual('branchA')
    expect(branchB.id).toEqual('branchB')
  })

  it('should find two experiments on branchA', () => {
    expect(experimentsByBranch.get('branchA')?.length).toEqual(2)
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
    expect(experimentsByBranch.size).toEqual(1)
  })

  const checkpoints = acc.checkpointsByTip.get('tip1') as Experiment[]

  it('should find three checkpoints on the tip', () => {
    expect(checkpoints?.length).toEqual(3)
  })
  const [tip1cp1, tip1cp2, tip1cp3] = checkpoints

  it('should find checkpoints in the correct order', () => {
    expect(tip1cp1.id).toEqual('tip1cp1')
    expect(tip1cp2.id).toEqual('tip1cp2')
    expect(tip1cp3.id).toEqual('tip1cp3')
  })

  it('should handle the continuation of a modified checkpoint', () => {
    const { checkpointsByTip } = collectExperiments(modifiedFixture)

    const modifiedCheckpointTip = checkpointsByTip
      .get('exp-01b3a')
      ?.filter(checkpoint => checkpoint.displayNameOrParent?.includes('('))

    expect(modifiedCheckpointTip).toHaveLength(1)
    expect(modifiedCheckpointTip?.[0].displayNameOrParent).toEqual('(3b0c6ac)')
    expect(modifiedCheckpointTip?.[0].label).toEqual('7e3cb21')

    const modifiedCheckpoint = checkpointsByTip
      .get('exp-9bc1b')
      ?.filter(checkpoint => checkpoint.displayNameOrParent?.includes('('))

    expect(modifiedCheckpoint).toHaveLength(1)
    expect(modifiedCheckpoint?.[0].displayNameOrParent).toEqual('(df39067)')
    expect(modifiedCheckpoint?.[0].label).toEqual('98cb38c')

    checkpointsByTip.forEach(checkpoints => {
      const continuationCheckpoints = checkpoints.filter(checkpoint => {
        const { label, displayNameOrParent } = checkpoint
        return (
          displayNameOrParent?.includes('(') &&
          !(label === '7e3cb21' && displayNameOrParent === '(3b0c6ac)') &&
          !(label === '98cb38c' && displayNameOrParent === '(df39067)')
        )
      })
      expect(continuationCheckpoints).toHaveLength(0)
    })
  })
})

describe('collectStatuses', () => {
  const buildMockExperiments = (n: number, prefix = 'exp') =>
    [...Array(n).keys()].map(id => ({
      id: `${prefix}${id + 1}`
    })) as Experiment[]

  it('should set new experiments to selected if there are less than 6', () => {
    const experiments = buildMockExperiments(4)

    expect(collectStatuses(experiments, new Map(), {})).toEqual({
      exp1: 1,
      exp2: 1,
      exp3: 1,
      exp4: 1
    })
  })

  it('should not push queued experiments into the returned object', () => {
    const experiments = [
      { id: 'exp1' },
      { id: 'exp2', queued: true }
    ] as Experiment[]

    expect(collectStatuses(experiments, new Map(), {})).toEqual({
      exp1: 1
    })
  })

  it('should not set more than 6 experiments to selected', () => {
    const experiments = buildMockExperiments(7)

    expect(collectStatuses(experiments, new Map(), {})).toEqual({
      exp1: 1,
      exp2: 1,
      exp3: 1,
      exp4: 1,
      exp5: 1,
      exp6: 1,
      exp7: 0
    })
  })

  it('should drop statuses when the experiment is no longer present', () => {
    const experiments = buildMockExperiments(1)

    expect(
      collectStatuses(experiments, new Map(), {
        exp2: 0,
        exp3: 1,
        exp4: 0,
        exp5: 1,
        exp6: 0,
        exp7: 1,
        exp8: 0
      })
    ).toEqual({ exp1: 1 })
  })

  it('should respect the existing status of experiments', () => {
    const experiments = buildMockExperiments(9)

    expect(
      collectStatuses(experiments, new Map(), {
        exp1: 0,
        exp2: 0,
        exp9: 1
      })
    ).toEqual({
      exp1: 0,
      exp2: 0,
      exp3: 1,
      exp4: 1,
      exp5: 1,
      exp6: 1,
      exp7: 1,
      exp8: 0,
      exp9: 1
    })
  })

  it('should not unselect an experiment that is existing and selected', () => {
    const experiments = buildMockExperiments(8)

    expect(collectStatuses(experiments, new Map(), { exp8: 1 })).toEqual({
      exp1: 1,
      exp2: 1,
      exp3: 1,
      exp4: 1,
      exp5: 1,
      exp6: 0,
      exp7: 0,
      exp8: 1
    })
  })

  it('should set the first new experiment to selected when there are already 5 selected', () => {
    const experiments = buildMockExperiments(8)

    expect(
      collectStatuses(experiments, new Map(), {
        exp4: 1,
        exp5: 1,
        exp6: 1,
        exp7: 1,
        exp8: 1
      })
    ).toEqual({
      exp1: 1,
      exp2: 0,
      exp3: 0,
      exp4: 1,
      exp5: 1,
      exp6: 1,
      exp7: 1,
      exp8: 1
    })
  })

  it('should default checkpoints to unselected', () => {
    const experiments = [{ id: 'exp1' }] as Experiment[]
    const checkpointsByTip = new Map<string, Experiment[]>([
      ['exp1', buildMockExperiments(5, 'check')]
    ])

    expect(collectStatuses(experiments, checkpointsByTip, {})).toEqual({
      check1: 0,
      check2: 0,
      check3: 0,
      check4: 0,
      check5: 0,
      exp1: 1
    })
  })

  it('should respect existing checkpoint statuses', () => {
    const experiments = [
      { id: 'expA' },
      { id: 'expB' },
      { id: 'expC' },
      { id: 'expD' }
    ] as Experiment[]
    const checkpointsByTip = new Map<string, Experiment[]>([
      ['expA', buildMockExperiments(5, 'checkA')],
      ['expB', buildMockExperiments(5, 'checkB')],
      ['expC', buildMockExperiments(5, 'checkC')],
      ['expD', buildMockExperiments(5, 'checkD')]
    ])

    expect(
      collectStatuses(experiments, checkpointsByTip, {
        checkC1: 1,
        checkD2: 1,
        checkD3: 1,
        checkD4: 1,
        checkD5: 1,
        expD: 1
      })
    ).toEqual({
      checkA1: 0,
      checkA2: 0,
      checkA3: 0,
      checkA4: 0,
      checkA5: 0,
      checkB1: 0,
      checkB2: 0,
      checkB3: 0,
      checkB4: 0,
      checkB5: 0,
      checkC1: 1,
      checkC2: 0,
      checkC3: 0,
      checkC4: 0,
      checkC5: 0,
      checkD1: 0,
      checkD2: 1,
      checkD3: 1,
      checkD4: 1,
      checkD5: 1,
      expA: 0,
      expB: 0,
      expC: 0,
      expD: 1
    })
  })
})
