import { canSelect } from './status'

describe('canSelect', () => {
  const mockStatus = {
    exp1: 1,
    exp2: 1,
    exp3: 1,
    exp4: 1,
    exp5: 1
  }

  it('should return true when there are less than 6 experiments selected', () => {
    expect(canSelect(mockStatus)).toBe(true)
  })

  it('should return false when there are 6 experiments selected', () => {
    expect(canSelect({ ...mockStatus, exp6: 1 })).toBe(false)
  })
})
