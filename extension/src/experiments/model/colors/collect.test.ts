import { colorsList as originalColorsList } from '.'
import { collectColors } from './collect'
import expShowFixture from '../../../test/fixtures/expShow/output'
import { ExperimentsOutput } from '../../../cli/reader'

describe('collectColors', () => {
  it('should assign the correct colors to the correct experiments', () => {
    const { assignedColors } = collectColors(expShowFixture, {})
    expect(assignedColors).toEqual({
      'exp-83425': '#CCA700',
      'exp-e7a67': '#F14C4C',
      'test-branch': '#3794FF'
    })
  })

  it('should return the original list of colors if no experiment names are found', () => {
    const { unusedColors } = collectColors({} as ExperimentsOutput, {})
    expect(unusedColors).toEqual(originalColorsList)
  })

  it('should add the colors of experiments which are no longer found back into the color list', () => {
    const { assignedColors, unusedColors } = collectColors(
      {} as ExperimentsOutput,
      {
        'exp-83425': '#CCA700',
        'exp-e7a67': '#F14C4C',
        'test-branch': '#3794FF'
      }
    )
    expect(assignedColors).toEqual({})
    expect(unusedColors).toEqual(originalColorsList)
  })
})
