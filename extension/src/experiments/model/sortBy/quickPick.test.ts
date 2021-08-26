import { join } from 'path'
import { mocked } from 'ts-jest/utils'
import { QuickPickOptions, window } from 'vscode'
import { pickSortToAdd } from './quickPick'
import { QuickPickItemWithValue } from '../../../vscode/quickPick'

jest.mock('vscode')

const mockedShowQuickPick = mocked<
  (
    items: QuickPickItemWithValue[],
    options: QuickPickOptions
  ) => Thenable<
    | QuickPickItemWithValue[]
    | QuickPickItemWithValue
    | string
    | undefined
    | unknown
  >
>(window.showQuickPick)

beforeEach(() => {
  jest.resetAllMocks()
})

const params = 'params'
const paramsYaml = 'params.yaml'
const paramsYamlPath = join(params, paramsYaml)
const epochsParamPath = join(paramsYamlPath, 'epochs')
const epochsParam = {
  group: params,
  hasChildren: false,
  maxNumber: 5,
  maxStringLength: 1,
  minNumber: 2,
  name: 'epochs',
  parentPath: paramsYamlPath,
  path: epochsParamPath,
  types: ['number']
}

const paramsYamlParam = {
  group: params,
  hasChildren: true,
  name: paramsYaml,
  parentPath: params,
  path: paramsYamlPath
}
const exampleParamsAndMetrics = [epochsParam, paramsYamlParam]

describe('pickSortToAdd', () => {
  it('should not invoke a quickPick if an empty array', async () => {
    const resolvedPromise = await pickSortToAdd([])
    expect(mockedShowQuickPick).not.toBeCalled()
    expect(resolvedPromise).toBe(undefined)
  })

  it('should resolve with no value if canceled at param or metric select', async () => {
    mockedShowQuickPick.mockResolvedValueOnce(undefined)
    expect(await pickSortToAdd(exampleParamsAndMetrics)).toBe(undefined)
    expect(mockedShowQuickPick).toBeCalledTimes(1)
  })

  it('should resolve with no value if canceled at order select', async () => {
    mockedShowQuickPick.mockResolvedValueOnce({
      value: epochsParam
    } as unknown)
    mockedShowQuickPick.mockResolvedValueOnce(undefined)
    expect(await pickSortToAdd(exampleParamsAndMetrics)).toBe(undefined)
    expect(mockedShowQuickPick).toBeCalledTimes(2)
  })

  it('should invoke a descending sort with the expected quickPick calls', async () => {
    mockedShowQuickPick.mockResolvedValueOnce({
      value: epochsParam
    } as unknown)
    mockedShowQuickPick.mockResolvedValueOnce({ value: false } as unknown)
    const resolvedPromise = await pickSortToAdd(exampleParamsAndMetrics)
    expect(mockedShowQuickPick).toBeCalledTimes(2)
    expect(mockedShowQuickPick).toBeCalledWith(
      [
        { label: 'Ascending', value: false },
        { label: 'Descending', value: true }
      ],
      { title: 'Select a direction to sort in' }
    )
    expect(resolvedPromise).toEqual({
      descending: false,
      path: epochsParamPath
    })
  })

  it('should invoke an ascending sort with the expected quickPick calls', async () => {
    mockedShowQuickPick.mockResolvedValueOnce({
      value: paramsYamlParam
    } as unknown)
    mockedShowQuickPick.mockResolvedValueOnce({ value: false } as unknown)
    const resolvedPromise = await pickSortToAdd(exampleParamsAndMetrics)
    expect(mockedShowQuickPick).toBeCalledTimes(2)
    expect(resolvedPromise).toEqual({
      descending: false,
      path: paramsYamlPath
    })
  })
})
