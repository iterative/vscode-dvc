import { pickExperiments } from './quickPicks'
import { quickPickLimitedValues } from '../../vscode/quickPick'
import { Experiment } from '../webview/contract'

jest.mock('../../vscode/quickPick')

const mockedQuickPickLimitedValues = jest.mocked(quickPickLimitedValues)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('pickExperiments', () => {
  it('should return early given no experiments', async () => {
    const undef = await pickExperiments([], false)
    expect(undef).toBeUndefined()
    expect(mockedQuickPickLimitedValues).not.toBeCalled()
  })

  it('should return the selected experiment ids', async () => {
    const selectedExperiment = {
      id: '7c366f6',
      label: 'exp-789',
      selected: false
    }
    const mockedExperiments = [
      { id: '73de3fe', label: 'exp-123', selected: false },
      { id: '0be657c', label: 'exp-456', selected: true },
      selectedExperiment
    ] as Experiment[]

    mockedQuickPickLimitedValues.mockResolvedValueOnce([selectedExperiment])
    const picked = await pickExperiments(mockedExperiments, false)

    expect(picked).toEqual([selectedExperiment])
    expect(mockedQuickPickLimitedValues).toBeCalledTimes(1)
    expect(mockedQuickPickLimitedValues).toBeCalledWith(
      [
        { label: 'exp-123', value: mockedExperiments[0] },
        { label: 'exp-456', value: mockedExperiments[1] },
        { label: 'exp-789', value: mockedExperiments[2] }
      ],
      [{ label: 'exp-456', value: mockedExperiments[1] }],
      6,
      'Select up to 6 experiments'
    )
  })
})
