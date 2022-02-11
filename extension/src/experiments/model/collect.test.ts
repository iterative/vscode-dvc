import { collectExperiments } from './collect'
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

    const modifiedExperiment = checkpointsByTip
      .get('exp-01b3a')
      ?.filter(checkpoint => checkpoint.displayNameOrParent?.includes('('))

    expect(modifiedExperiment).toHaveLength(1)
    expect(modifiedExperiment?.[0].displayNameOrParent).toEqual('(3b0c6ac)')
    expect(modifiedExperiment?.[0].label).toEqual('7e3cb21')

    checkpointsByTip.forEach(checkpoints => {
      const continuationCheckpoints = checkpoints.filter(checkpoint => {
        const { label, displayNameOrParent } = checkpoint
        return (
          displayNameOrParent?.includes('(') &&
          label !== '7e3cb21' &&
          displayNameOrParent !== '(3b0c6ac)'
        )
      })
      expect(continuationCheckpoints).toHaveLength(0)
    })
  })
})
