import { copyOriginalColors } from '.'
import { collectColors } from './collect'

const generateExperimentNameList = (n: number): string[] =>
  Array.from({ length: n }, (_, i) => `exp-${i + 1}`)

describe('collectColors', () => {
  it('should assign the correct colors to the correct experiments', () => {
    const { assigned } = collectColors(
      ['exp-e7a67', 'test-branch', 'exp-83425'],
      new Map()
    )
    expect(assigned).toEqual(
      new Map([
        ['exp-83425', '#CCA700'],
        ['exp-e7a67', '#F14C4C'],
        ['test-branch', '#3794FF']
      ])
    )
  })

  it('should return the original list of colors if no experiment names are found', () => {
    const { available } = collectColors([], new Map())
    expect(available).toEqual(copyOriginalColors())
  })

  it('should return the original colors list if no experiments names are provided', () => {
    const { assigned, available } = collectColors(
      [],
      new Map([
        ['exp-e7a67', '#F14C4C'],
        ['test-branch', '#3794FF'],
        ['exp-83425', '#CCA700']
      ]),
      []
    )
    expect(assigned).toEqual(new Map())
    expect(available).toEqual(copyOriginalColors())
  })

  it('should add the colors of experiments which are no longer found back into the color list', () => {
    const originalColorsList = copyOriginalColors()

    const { assigned, available } = collectColors(
      [],
      new Map([
        ['exp-e7a67', '#F14C4C'],
        ['test-branch', '#3794FF'],
        ['exp-83425', '#CCA700']
      ]),
      originalColorsList.slice(3)
    )
    expect(assigned).toEqual(new Map())
    expect(available).toEqual(originalColorsList)
  })

  it('should return the original assigned and unassigned colors given the same info', () => {
    const originalColorsList = copyOriginalColors()
    const originalAssigned = new Map([
      ['exp-83425', '#CCA700'],
      ['exp-e7a67', '#F14C4C'],
      ['test-branch', '#3794FF']
    ])

    const originalAvailable = originalColorsList.slice(2)

    const { assigned, available } = collectColors(
      ['exp-83425', 'exp-e7a67', 'test-branch'],
      originalAssigned,
      originalAvailable
    )
    expect(assigned).toEqual(originalAssigned)
    expect(available).toEqual(originalAvailable)
  })

  it('should return the correct colors after exhausting the first 50', () => {
    const originalColorsList = copyOriginalColors()
    const experimentNames = generateExperimentNameList(151)

    const firstColor = originalColorsList[0]
    const lastColor = originalColorsList[49]

    const { assigned, available } = collectColors(experimentNames, new Map())

    expect(assigned.get('exp-50')).toEqual(lastColor)
    expect(assigned.get('exp-51')).toEqual(firstColor)
    expect(assigned.get('exp-100')).toEqual(lastColor)
    expect(assigned.get('exp-101')).toEqual(firstColor)
    expect(assigned.get('exp-150')).toEqual(lastColor)
    expect(assigned.get('exp-151')).toEqual(firstColor)
    expect(available).toEqual(originalColorsList.slice(1))
  })

  it('should not make colors available more than once in the list', () => {
    const originalColorsList = copyOriginalColors()
    const experimentNames = generateExperimentNameList(51)

    const lastColor = originalColorsList[49]

    const { assigned, available } = collectColors(experimentNames, new Map())

    expect(assigned.get('exp-50')).toEqual(lastColor)
    expect(available).toEqual(originalColorsList.slice(1))

    const { assigned: stillAssigned, available: nowAvailable } = collectColors(
      experimentNames.filter(name => name !== 'exp-50'),
      assigned,
      available
    )

    expect(stillAssigned.has('exp-50')).toBeFalsy()
    expect(nowAvailable).toEqual(originalColorsList.slice(1))
  })
})
