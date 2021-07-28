import { collectExperiments } from './collectExperiments'
import { Experiment } from '../webview/contract'

describe('branch and checkpoint nesting', () => {
  it('returns an empty array if no branches are present', () => {
    const { branches } = collectExperiments({
      workspace: {
        baseline: {}
      }
    })
    expect(branches).toEqual([])
  })

  describe('a repo with two branches', () => {
    const { branches, experimentsByBranch, workspace } = collectExperiments({
      branchA: {
        baseline: { data: {} },
        otherExp1: { data: {} },
        otherExp2: {
          data: { checkpoint_tip: 'otherExp2' }
        },
        otherExp2_1: {
          data: { checkpoint_tip: 'otherExp2' }
        }
      },
      branchB: {
        baseline: { data: {} }
      },
      workspace: {
        baseline: {}
      }
    })

    it('defines workspace', () => {
      expect(workspace).toBeDefined()
    })

    it('finds two branches', () => {
      expect(branches.length).toEqual(2)
    })

    const [branchA, branchB] = branches
    it('lists branches in the same order as the map', () => {
      expect(branchA.id).toEqual('branchA')
      expect(branchB.id).toEqual('branchB')
    })

    it('finds two experiments on branchA', () => {
      expect(experimentsByBranch.get('branchA')?.length).toEqual(2)
    })

    it('finds no experiments on branchB', () => {
      expect(experimentsByBranch.get('branchB')).toBeUndefined()
    })
  })

  describe('a repo with one branch that has nested checkpoints', () => {
    const { experimentsByBranch, checkpointsByTip } = collectExperiments({
      branchA: {
        baseline: { data: {} },
        tip1: {
          data: { checkpoint_tip: 'tip1' }
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
    })

    it('only lists the tip as a top-level experiment', () => {
      expect(experimentsByBranch.size).toEqual(1)
    })

    const checkpoints = checkpointsByTip.get('tip1') as Experiment[]

    it('finds three checkpoints on the tip', () => {
      expect(checkpoints?.length).toEqual(3)
    })
    const [tip1cp1, tip1cp2, tip1cp3] = checkpoints

    it('finds checkpoints in order', () => {
      expect(tip1cp1.id).toEqual('tip1cp1')
      expect(tip1cp2.id).toEqual('tip1cp2')
      expect(tip1cp3.id).toEqual('tip1cp3')
    })
  })
})
