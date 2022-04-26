import { copyOriginalColors } from './colors'
import { collectExperiments, collectColoredStatus } from './collect'
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

describe('collectColoredStatus', () => {
  const buildMockExperiments = (n: number, prefix = 'exp') => {
    const mockExperiments: Experiment[] = []
    for (let id = 0; id < n; id++) {
      mockExperiments.push({
        id: `${prefix}${id + 1}`
      } as Experiment)
    }
    return mockExperiments
  }

  it('should set new experiments to selected if there are less than 7', () => {
    const experiments = buildMockExperiments(4)
    const colors = copyOriginalColors()

    const { availableColors, coloredStatus } = collectColoredStatus(
      experiments,
      new Map(),
      {},
      copyOriginalColors()
    )

    expect(availableColors).toStrictEqual(colors.slice(4))
    expect(coloredStatus).toStrictEqual({
      exp1: colors[0],
      exp2: colors[1],
      exp3: colors[2],
      exp4: colors[3]
    })
  })

  it('should not push queued experiments into the returned object', () => {
    const experiments = [
      { id: 'exp1' },
      { id: 'exp2', queued: true }
    ] as Experiment[]
    const colors = copyOriginalColors()

    const { availableColors, coloredStatus } = collectColoredStatus(
      experiments,
      new Map(),
      {},
      copyOriginalColors()
    )

    expect(availableColors).toStrictEqual(colors.slice(1))
    expect(coloredStatus).toStrictEqual({
      exp1: colors[0]
    })
  })

  it('should not set more than 7 experiments to selected', () => {
    const experiments = buildMockExperiments(8)
    const colors = copyOriginalColors()

    const { availableColors, coloredStatus } = collectColoredStatus(
      experiments,
      new Map(),
      {},
      copyOriginalColors()
    )

    expect(availableColors).toStrictEqual([])
    expect(coloredStatus).toStrictEqual({
      exp1: colors[0],
      exp2: colors[1],
      exp3: colors[2],
      exp4: colors[3],
      exp5: colors[4],
      exp6: colors[5],
      exp7: colors[6],
      exp8: 0
    })
  })

  it('should drop colors when the experiment is no longer present', () => {
    const experiments = buildMockExperiments(1)
    const colors = copyOriginalColors()

    const { availableColors, coloredStatus } = collectColoredStatus(
      experiments,
      new Map(),
      {
        exp2: 0,
        exp3: colors[2],
        exp4: 0,
        exp5: colors[1],
        exp6: 0,
        exp7: colors[0],
        exp8: 0
      },
      copyOriginalColors().slice(3)
    )

    expect(coloredStatus).toStrictEqual({ exp1: colors[0] })
    expect(availableColors).toStrictEqual(colors.slice(1))
  })

  it('should respect existing experiment colors', () => {
    const experiments = buildMockExperiments(10)
    const colors = copyOriginalColors()

    const { availableColors, coloredStatus } = collectColoredStatus(
      experiments,
      new Map(),
      {
        exp1: 0,
        exp10: colors[0],
        exp2: 0,
        exp9: colors[1]
      },
      copyOriginalColors().slice(2)
    )

    expect(coloredStatus).toStrictEqual({
      exp1: 0,
      exp10: colors[0],
      exp2: 0,
      exp3: colors[2],
      exp4: colors[3],
      exp5: colors[4],
      exp6: colors[5],
      exp7: colors[6],
      exp8: 0,
      exp9: colors[1]
    })
    expect(availableColors).toStrictEqual([])
  })

  it('should not unselect an experiment that is existing and selected', () => {
    const experiments = buildMockExperiments(9)
    const colors = copyOriginalColors()

    const { availableColors, coloredStatus } = collectColoredStatus(
      experiments,
      new Map(),
      { exp9: colors[0] },
      copyOriginalColors().slice(1)
    )

    expect(availableColors).toStrictEqual([])
    expect(coloredStatus).toStrictEqual({
      exp1: colors[1],
      exp2: colors[2],
      exp3: colors[3],
      exp4: colors[4],
      exp5: colors[5],
      exp6: colors[6],
      exp7: 0,
      exp8: 0,
      exp9: colors[0]
    })
  })

  it('should set the first new experiment to selected when there are already 6 selected', () => {
    const experiments = buildMockExperiments(9)
    const colors = copyOriginalColors()

    const { availableColors, coloredStatus } = collectColoredStatus(
      experiments,
      new Map(),
      {
        exp4: colors[0],
        exp5: colors[1],
        exp6: colors[2],
        exp7: colors[3],
        exp8: colors[4],
        exp9: colors[5]
      },
      copyOriginalColors().slice(6)
    )

    expect(availableColors).toStrictEqual([])
    expect(coloredStatus).toStrictEqual({
      exp1: colors[6],
      exp2: 0,
      exp3: 0,
      exp4: colors[0],
      exp5: colors[1],
      exp6: colors[2],
      exp7: colors[3],
      exp8: colors[4],
      exp9: colors[5]
    })
  })

  it('should default checkpoints to unselected', () => {
    const experiments = [{ id: 'exp1' }] as Experiment[]
    const checkpointsByTip = new Map<string, Experiment[]>([
      ['exp1', buildMockExperiments(5, 'check')]
    ])
    const colors = copyOriginalColors()

    const { availableColors, coloredStatus } = collectColoredStatus(
      experiments,
      checkpointsByTip,
      {},
      copyOriginalColors()
    )

    expect(availableColors).toStrictEqual(colors.slice(1))
    expect(coloredStatus).toStrictEqual({
      check1: 0,
      check2: 0,
      check3: 0,
      check4: 0,
      check5: 0,
      exp1: colors[0]
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
      ['expD', buildMockExperiments(6, 'checkD')]
    ])
    const colors = copyOriginalColors()

    const { availableColors, coloredStatus } = collectColoredStatus(
      experiments,
      checkpointsByTip,
      {
        checkC1: colors[1],
        checkD2: colors[2],
        checkD3: colors[3],
        checkD4: colors[4],
        checkD5: colors[5],
        checkD6: colors[6],
        expD: colors[0]
      },
      []
    )

    expect(availableColors).toStrictEqual([])
    expect(coloredStatus).toStrictEqual({
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
      checkC1: colors[1],
      checkC2: 0,
      checkC3: 0,
      checkC4: 0,
      checkC5: 0,
      checkD1: 0,
      checkD2: colors[2],
      checkD3: colors[3],
      checkD4: colors[4],
      checkD5: colors[5],
      checkD6: colors[6],
      expA: 0,
      expB: 0,
      expC: 0,
      expD: colors[0]
    })
  })
})
