import { pickParamsToQueue } from './quickPick'
import { getInput } from '../../../vscode/inputBox'
import { quickPickManyValues } from '../../../vscode/quickPick'

jest.mock('../../../vscode/inputBox')
jest.mock('../../../vscode/quickPick')

const mockedGetInput = jest.mocked(getInput)
const mockedQuickPickManyValues = jest.mocked(quickPickManyValues)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('pickParamsToQueue', () => {
  it('should return early if no params are selected', async () => {
    mockedQuickPickManyValues.mockResolvedValueOnce(undefined)

    const paramsToQueue = await pickParamsToQueue([
      { path: 'params.yaml:learning_rate', value: 2e-12 }
    ])

    expect(paramsToQueue).toBeUndefined()
    expect(mockedGetInput).not.toBeCalled()
  })

  it('should return early if the user exits from the input box', async () => {
    const unchanged = { path: 'params.yaml:learning_rate', value: 2e-12 }
    const initialUserResponse = [
      { path: 'params.yaml:dropout', value: 0.15 },
      { path: 'params.yaml:process.threshold', value: 0.86 }
    ]
    mockedQuickPickManyValues.mockResolvedValueOnce(initialUserResponse)
    const firstInput = '0.16'
    mockedGetInput.mockResolvedValueOnce(firstInput)
    mockedGetInput.mockResolvedValueOnce(undefined)

    const paramsToQueue = await pickParamsToQueue([
      unchanged,
      ...initialUserResponse
    ])

    expect(paramsToQueue).toBeUndefined()
    expect(mockedGetInput).toBeCalledTimes(2)
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

    const paramsToQueue = await pickParamsToQueue([
      unchanged,
      ...initialUserResponse
    ])

    expect(paramsToQueue).toStrictEqual([
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
