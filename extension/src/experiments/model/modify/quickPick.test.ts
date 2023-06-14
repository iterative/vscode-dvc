import { pickAndModifyParams } from './quickPick'
import { getInput } from '../../../vscode/inputBox'
import { quickPickManyValues } from '../../../vscode/quickPick'

jest.mock('../../../vscode/inputBox')
jest.mock('../../../vscode/quickPick')

const mockedGetInput = jest.mocked(getInput)
const mockedQuickPickManyValues = jest.mocked(quickPickManyValues)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('pickAndModifyParams', () => {
  it('should return early if no params are selected', async () => {
    mockedQuickPickManyValues.mockResolvedValueOnce(undefined)

    const paramsToQueue = await pickAndModifyParams([
      { path: 'params.yaml:learning_rate', value: 2e-12 }
    ])

    expect(paramsToQueue).toBeUndefined()
    expect(mockedGetInput).not.toHaveBeenCalled()
  })

  it('should return early if the user exits from the input box', async () => {
    const unchanged = {
      path: 'params.yaml:learning_rate',
      value: 2e-12
    }
    const initialUserResponse = [
      { path: 'params.yaml:dropout', value: 0.15 },
      { path: 'params.yaml:process.threshold', value: 0.86 }
    ]
    mockedQuickPickManyValues.mockResolvedValueOnce(initialUserResponse)
    const firstInput = '0.16'
    mockedGetInput.mockResolvedValueOnce(firstInput)
    mockedGetInput.mockResolvedValueOnce(undefined)

    const paramsToQueue = await pickAndModifyParams([
      unchanged,
      ...initialUserResponse
    ])

    expect(paramsToQueue).toBeUndefined()
    expect(mockedGetInput).toHaveBeenCalledTimes(2)
  })

  it('should convert any selected params into the required format', async () => {
    const unchanged = {
      path: 'params.yaml:learning_rate',
      value: 2e-12
    }

    const initialUserResponse = [
      { path: 'params.yaml:dropout', value: 0.15 },
      { path: 'params.yaml:process.threshold', value: 0.86 },
      { path: 'params.yaml:code_names', value: [0, 1, 2] },
      { path: 'params.yaml:arch', value: 'resnet18' },
      {
        path: 'params.yaml:transforms',
        value: '[Pipeline: PILBase.create, Pipeline: partial -> PILBase.create]'
      }
    ]
    mockedQuickPickManyValues.mockResolvedValueOnce(initialUserResponse)
    const input1 = '0.16'
    const input2 = '0.87,0.88'
    const input3 = '[0,1,3]'
    const input4 = 'resnet18,shufflenet_v2_x2_0'
    const input5 = "'[Pipeline: PILBase.create]'" // user needs to quote
    mockedGetInput.mockResolvedValueOnce(input1)
    mockedGetInput.mockResolvedValueOnce(input2)
    mockedGetInput.mockResolvedValueOnce(input3)
    mockedGetInput.mockResolvedValueOnce(input4)
    mockedGetInput.mockResolvedValueOnce(input5)

    const paramsToQueue = await pickAndModifyParams([
      unchanged,
      ...initialUserResponse
    ])

    expect(mockedGetInput).toHaveBeenCalledTimes(5)
    expect(mockedGetInput).toHaveBeenCalledWith(
      'Enter a Value for params.yaml:dropout',
      '0.15'
    )

    expect(mockedGetInput).toHaveBeenCalledWith(
      'Enter a Value for params.yaml:process.threshold',
      '0.86'
    )

    expect(mockedGetInput).toHaveBeenCalledWith(
      'Enter a Value for params.yaml:code_names',
      '[0,1,2]'
    )

    expect(mockedGetInput).toHaveBeenCalledWith(
      'Enter a Value for params.yaml:arch',
      'resnet18'
    )

    expect(mockedGetInput).toHaveBeenCalledWith(
      'Enter a Value for params.yaml:transforms',
      '[Pipeline: PILBase.create, Pipeline: partial -> PILBase.create]'
    )

    expect(paramsToQueue).toStrictEqual([
      '-S',
      `params.yaml:dropout=${input1}`,
      '-S',
      `params.yaml:process.threshold=${input2}`,
      '-S',
      `params.yaml:code_names=${input3}`,
      '-S',
      `params.yaml:arch=${input4}`,
      '-S',
      `params.yaml:transforms=${input5}`
    ])
  })
})
