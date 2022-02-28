import { canSelect, limitToMaxSelected } from './status'
import { Experiment } from '../webview/contract'

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

describe('limitToMaxSelected', () => {
  const mockedExperiments = [
    { id: '1', label: 'A' },
    { id: '2', label: 'B', timestamp: null },
    { id: '3', label: 'C', timestamp: '2022-02-20T09:10:52' },
    { id: '4', label: 'D', timestamp: '2022-02-20T09:10:53' },
    { id: '5', label: 'E', timestamp: '2022-02-20T09:10:54' },
    { id: '6', label: 'F', timestamp: '2022-02-20T09:10:55' },
    { id: '7', label: 'G', timestamp: '2022-02-20T09:10:56' },
    { id: '8', label: 'H', timestamp: '2022-02-20T09:10:57' },
    { id: '9', label: 'I', timestamp: '2022-02-20T09:10:58' }
  ] as Experiment[]

  it('should return the first 6 selected by timestamp', () => {
    expect(
      limitToMaxSelected(mockedExperiments)
        .map(({ label }) => label)
        .sort()
    ).toStrictEqual(['D', 'E', 'F', 'G', 'H', 'I'])
  })

  it('should give running experiments precedence', () => {
    expect(
      limitToMaxSelected([
        ...mockedExperiments,
        { id: '1', label: 'R', running: true }
      ])
        .map(({ label }) => label)
        .sort()
    ).toStrictEqual(['E', 'F', 'G', 'H', 'I', 'R'])
  })
})
