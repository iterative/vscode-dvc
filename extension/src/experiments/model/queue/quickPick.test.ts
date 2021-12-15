import { mocked } from 'ts-jest/utils'
import { pickParamsAndVary } from './quickPick'
import { getInput } from '../../../vscode/inputBox'
import { quickPickManyValues } from '../../../vscode/quickPick'

jest.mock('../../../vscode/inputBox')
jest.mock('../../../vscode/quickPick')

const mockedGetInput = mocked(getInput)
const mockedQuickPickManyValues = mocked(quickPickManyValues)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('pickParamsAndVary', () => {
  it('should return early if no params are selected', async () => {
    mockedQuickPickManyValues.mockResolvedValueOnce(undefined)

    const paramsToQueue = await pickParamsAndVary([
      { path: 'params.yaml:learning_rate', value: 2e-12 }
    ])

    expect(paramsToQueue).toEqual(undefined)
    expect(mockedGetInput).not.toBeCalled()
  })

  it('should convert any selected params into the required format', async () => {
    const unchanged = { path: 'params.yaml:learning_rate', value: 2e-12 }
    const initialUserResponse = [
      { path: 'params.yaml:dropout', value: 0.15 },
      { path: 'params.yaml:process.threshold', value: 0.86 }
    ]
    mockedQuickPickManyValues.mockResolvedValueOnce(initialUserResponse)
    const firstInput = '0.16'
    const secondInput = '0.87'
    mockedGetInput.mockResolvedValueOnce(firstInput)
    mockedGetInput.mockResolvedValueOnce(secondInput)

    const paramsToQueue = await pickParamsAndVary([
      unchanged,
      ...initialUserResponse
    ])

    expect(paramsToQueue).toEqual([
      '-S',
      `params.yaml:dropout=${firstInput}`,
      '-S',
      `params.yaml:process.threshold=${secondInput}`,
      '-S',
      [unchanged.path, unchanged.value].join('=')
    ])
    expect(mockedGetInput).toBeCalledTimes(2)
  })
})
