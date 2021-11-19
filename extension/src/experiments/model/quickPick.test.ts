import { mocked } from 'ts-jest/utils'
import { pickExperiments } from './quickPicks'
import { quickPickManyValues } from '../../vscode/quickPick'
import { Experiment } from '../webview/contract'

jest.mock('../../vscode/quickPick')

const mockedQuickPickManyValues = mocked(quickPickManyValues)

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
    const selectedId = '7c366f6'
    const mockedExperiments = [
      { displayName: 'exp-123', id: '73de3fe', selected: false },
      { displayName: 'exp-456', id: '0be657c', selected: true },
      { displayName: 'exp-789', id: selectedId, selected: false }
    ] as Experiment[]

    mockedQuickPickManyValues.mockResolvedValueOnce([selectedId])
    const picked = await pickExperiments(mockedExperiments)
    expect(picked).toEqual([selectedId])
    expect(mockedQuickPickManyValues).toBeCalledTimes(1)
  })
})
