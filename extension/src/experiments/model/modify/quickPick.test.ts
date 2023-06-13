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
      { isString: false, path: 'params.yaml:learning_rate', value: 2e-12 }
    ])

    expect(paramsToQueue).toBeUndefined()
    expect(mockedGetInput).not.toHaveBeenCalled()
  })

  it('should return early if the user exits from the input box', async () => {
    const unchanged = {
      isString: false,
      path: 'params.yaml:learning_rate',
      value: 2e-12
    }
    const initialUserResponse = [
      { isString: false, path: 'params.yaml:dropout', value: 0.15 },
      { isString: false, path: 'params.yaml:process.threshold', value: 0.86 }
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
      isString: false,
      path: 'params.yaml:learning_rate',
      value: 2e-12
    }

    const initialUserResponse = [
      { isString: false, path: 'params.yaml:dropout', value: 0.15 },
      { isString: false, path: 'params.yaml:process.threshold', value: 0.86 },
      { isString: false, path: 'params.yaml:code_names', value: [0, 1, 2] },
      {
        isString: true,
        path: 'params.yaml:transforms',
        value: '[Pipeline: PILBase.create, Pipeline: partial -> PILBase.create]'
      }
    ]
    mockedQuickPickManyValues.mockResolvedValueOnce(initialUserResponse)
    const firstInput = '0.16'
    const secondInput = '0.87'
    const thirdInput = '[0,1,3]'
    const fourthInput = '[Pipeline: PILBase.create]'
    mockedGetInput.mockResolvedValueOnce(firstInput)
    mockedGetInput.mockResolvedValueOnce(secondInput)
    mockedGetInput.mockResolvedValueOnce(thirdInput)
    mockedGetInput.mockResolvedValueOnce(fourthInput)

    const paramsToQueue = await pickAndModifyParams([
      unchanged,
      ...initialUserResponse
    ])

    expect(mockedGetInput).toHaveBeenCalledTimes(4)
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
      'Enter a Value for params.yaml:transforms',
      '[Pipeline: PILBase.create, Pipeline: partial -> PILBase.create]'
    )

    expect(paramsToQueue).toStrictEqual([
      '-S',
      `params.yaml:dropout=${firstInput}`,
      '-S',
      `params.yaml:process.threshold=${secondInput}`,
      '-S',
      `params.yaml:code_names=${thirdInput}`,
      '-S',
      `params.yaml:transforms='${fourthInput}'`,
      '-S',
      [unchanged.path, unchanged.value].join('=')
    ])
  })

  it('should convert any unselected params into the required format', async () => {
    const numericValue = {
      isString: false,
      path: 'params.yaml:learning_rate',
      value: 2e-12
    }
    const stringArrayValue = {
      isString: true,
      path: 'params.yaml:transforms',
      value: '[Pipeline: PILBase.create, Pipeline: partial -> PILBase.create]'
    }

    const actualArrayValue = {
      isString: false,
      path: 'params.yaml:code_names',
      value: [0, 1, 2]
    }

    const unchanged = [numericValue, stringArrayValue, actualArrayValue]
    const initialUserResponse = {
      isString: false,
      path: 'params.yaml:dropout',
      value: 0.15
    }

    mockedQuickPickManyValues.mockResolvedValueOnce([initialUserResponse])
    const firstInput = '0.16'
    mockedGetInput.mockResolvedValueOnce(firstInput)

    const paramsToQueue = await pickAndModifyParams([
      ...unchanged,
      initialUserResponse
    ])

    expect(mockedGetInput).toHaveBeenCalledTimes(1)

    expect(paramsToQueue).toStrictEqual([
      '-S',
      `params.yaml:dropout=${firstInput}`,
      '-S',
      [numericValue.path, numericValue.value].join('='),
      '-S',
      [stringArrayValue.path, `'${stringArrayValue.value}'`].join('='),
      '-S',
      [actualArrayValue.path, JSON.stringify(actualArrayValue.value)].join('=')
    ])
  })
})
