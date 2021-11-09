import { colorsList as originalColorsList } from '.'
import { collectColors } from './collect'

describe('collectColors', () => {
  it('should assign the correct colors to the correct experiments', () => {
    const { assignedColors } = collectColors(
      ['exp-e7a67', 'test-branch', 'exp-83425'],
      {}
    )
    expect(assignedColors).toEqual({
      'exp-83425': '#CCA700',
      'exp-e7a67': '#F14C4C',
      'test-branch': '#3794FF'
    })
  })

  it('should return the original list of colors if no experiment names are found', () => {
    const { unassignedColors } = collectColors([], {})
    expect(unassignedColors).toEqual(originalColorsList)
  })

  it('should add the colors of experiments which are no longer found back into the color list', () => {
    const { assignedColors, unassignedColors } = collectColors([], {
      'exp-83425': '#CCA700',
      'exp-e7a67': '#F14C4C',
      'test-branch': '#3794FF'
    })
    expect(assignedColors).toEqual({})
    expect(unassignedColors).toEqual(originalColorsList)
  })
})
