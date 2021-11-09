import { colorsList as originalColorsList } from '.'
import { collectColors } from './collect'

describe('collectColors', () => {
  it('should assign the correct colors to the correct experiments', () => {
    const { assignedColors } = collectColors(
      ['exp-e7a67', 'test-branch', 'exp-83425'],
      new Map()
    )
    expect(assignedColors).toEqual(
      new Map([
        ['exp-83425', '#CCA700'],
        ['exp-e7a67', '#F14C4C'],
        ['test-branch', '#3794FF']
      ])
    )
  })

  it('should return the original list of colors if no experiment names are found', () => {
    const { unassignedColors } = collectColors([], new Map())
    expect(unassignedColors).toEqual(originalColorsList)
  })

  it('should add the colors of experiments which are no longer found back into the color list', () => {
    const { assignedColors, unassignedColors } = collectColors(
      [],
      new Map([
        ['exp-e7a67', '#F14C4C'],
        ['test-branch', '#3794FF'],
        ['exp-83425', '#CCA700']
      ]),
      originalColorsList.slice(3)
    )
    expect(assignedColors).toEqual(new Map())
    expect(unassignedColors).toEqual(originalColorsList)
  })

  it('should return the original assigned and unassigned colors given the same info', () => {
    const originalAssignedColors = new Map([
      ['exp-83425', '#CCA700'],
      ['exp-e7a67', '#F14C4C'],
      ['test-branch', '#3794FF']
    ])

    const originalUnassignedColors = originalColorsList.slice(2)

    const { assignedColors, unassignedColors } = collectColors(
      ['exp-83425', 'exp-e7a67', 'test-branch'],
      originalAssignedColors,
      originalUnassignedColors
    )
    expect(assignedColors).toEqual(originalAssignedColors)
    expect(unassignedColors).toEqual(originalUnassignedColors)
  })

  it('should return the correct colors after exhausting the first 50', () => {
    const experimentNames = Array.from(
      { length: 151 },
      (_, i) => `exp-${i + 1}`
    )

    const firstColor = originalColorsList[0]
    const lastColor = originalColorsList[49]

    const { assignedColors, unassignedColors } = collectColors(
      experimentNames,
      new Map()
    )

    expect(assignedColors.get('exp-50')).toEqual(lastColor)
    expect(assignedColors.get('exp-51')).toEqual(firstColor)
    expect(assignedColors.get('exp-100')).toEqual(lastColor)
    expect(assignedColors.get('exp-101')).toEqual(firstColor)
    expect(assignedColors.get('exp-150')).toEqual(lastColor)
    expect(assignedColors.get('exp-151')).toEqual(firstColor)
    expect(unassignedColors).toEqual(originalColorsList.slice(1))
  })
})
