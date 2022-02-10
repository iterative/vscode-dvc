import { pickExperiments } from './quickPicks'
import { quickPickManyValues } from '../../vscode/quickPick'
import { Experiment } from '../webview/contract'

jest.mock('../../vscode/quickPick')

const mockedQuickPickManyValues = jest.mocked(quickPickManyValues)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('pickExperiments', () => {
  it('should return early given no experiments', async () => {
    const undef = await pickExperiments([])
    expect(undef).toBeUndefined()
    expect(mockedQuickPickManyValues).not.toBeCalled()
  })

  it('should return the selected experiment ids', async () => {
    const selectedExperiment = {
      displayId: 'exp-789',
      id: '7c366f6',
      selected: false
    }
    const mockedExperiments = [
      { displayId: 'exp-123', id: '73de3fe', selected: false },
      { displayId: 'exp-456', id: '0be657c', selected: true },
      selectedExperiment
    ] as Experiment[]

    mockedQuickPickManyValues.mockResolvedValueOnce([selectedExperiment])
    const picked = await pickExperiments(mockedExperiments)

    expect(picked).toEqual([selectedExperiment])
    expect(mockedQuickPickManyValues).toBeCalledTimes(1)
    expect(mockedQuickPickManyValues).toBeCalledWith(
      [
        { label: 'exp-123', picked: false, value: mockedExperiments[0] },
        { label: 'exp-456', picked: true, value: mockedExperiments[1] },
        { label: 'exp-789', picked: false, value: mockedExperiments[2] }
      ],
      { title: 'Select experiments' }
    )
  })
})
