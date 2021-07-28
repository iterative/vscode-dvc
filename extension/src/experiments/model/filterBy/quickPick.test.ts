import { join } from 'path'
import { mocked } from 'ts-jest/utils'
import { QuickPickOptions, window } from 'vscode'
import { FilterDefinition, Operator } from '.'
import { operators, pickFiltersToRemove, pickFilterToAdd } from './quickPick'
import { getInput } from '../../../vscode/inputBox'
import { QuickPickItemWithValue } from '../../../vscode/quickPick'

jest.mock('vscode')
jest.mock('../../../vscode/inputBox')

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
const mockedGetInput = mocked(getInput)

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
const boolParam = {
  group: params,
  hasChildren: false,
  maxNumber: 1,
  maxStringLength: 1,
  minNumber: 0,
  name: 'bool',
  parentPath: paramsYamlPath,
  path: join(paramsYamlPath, 'bool'),
  types: ['boolean']
}
const mixedParam = {
  group: params,
  hasChildren: false,
  maxNumber: 5,
  maxStringLength: 44,
  minNumber: 2,
  name: 'mixed',
  parentPath: paramsYamlPath,
  path: join(paramsYamlPath, 'mixed'),
  types: ['number', 'string', 'boolean']
}

describe('pickFilterToAdd', () => {
  it('should return early if no param or metric is picked', async () => {
    const params = [epochsParam]
    mockedShowQuickPick.mockResolvedValueOnce(undefined)
    const filter = await pickFilterToAdd(params)
    expect(filter).toBeUndefined()
  })

  it('should return early if no operator is picked', async () => {
    const params = [epochsParam]
    mockedShowQuickPick.mockResolvedValueOnce({
      value: epochsParam
    } as unknown)
    mockedShowQuickPick.mockResolvedValueOnce(undefined)
    const filter = await pickFilterToAdd(params)
    expect(filter).toBeUndefined()
  })

  it('should call showQuickPick with the correct operators for a mixed type param', async () => {
    const params = [mixedParam]
    mockedShowQuickPick.mockResolvedValueOnce({
      value: mixedParam
    } as unknown)
    mockedShowQuickPick.mockResolvedValueOnce(undefined)
    await pickFilterToAdd(params)
    expect(mockedShowQuickPick).toBeCalledWith(operators, {
      title: 'Select an operator'
    })
  })

  it('should return early if no value is provided', async () => {
    const params = [epochsParam]
    mockedShowQuickPick.mockResolvedValueOnce({
      value: epochsParam
    } as unknown)
    mockedShowQuickPick.mockResolvedValueOnce({
      value: '=='
    } as unknown)
    mockedGetInput.mockResolvedValueOnce(undefined)
    const filter = await pickFilterToAdd(params)
    expect(filter).toBeUndefined()
  })

  it('should return without asking for a value when a boolean param is selected', async () => {
    const params = [boolParam]
    mockedShowQuickPick.mockResolvedValueOnce({
      value: boolParam
    } as unknown)
    mockedShowQuickPick.mockResolvedValueOnce({
      value: Operator.IS_TRUE
    } as unknown)
    const filter = await pickFilterToAdd(params)
    expect(filter).toEqual({
      operator: Operator.IS_TRUE,
      path: boolParam.path,
      value: undefined
    })
    expect(mockedShowQuickPick).toBeCalledWith(
      operators.filter(operator => operator.types.includes('boolean')),
      {
        title: 'Select an operator'
      }
    )
    expect(mockedGetInput).not.toBeCalled()
  })

  it('should return a filter definition if all of the steps are completed', async () => {
    const params = [epochsParam]
    mockedShowQuickPick.mockResolvedValueOnce({
      value: epochsParam
    } as unknown)
    mockedShowQuickPick.mockResolvedValueOnce({
      value: '=='
    } as unknown)
    mockedGetInput.mockResolvedValueOnce('5')
    const filter = await pickFilterToAdd(params)
    expect(filter).toEqual({
      operator: '==',
      path: epochsParam.path,
      value: '5'
    })
    expect(mockedShowQuickPick).toBeCalledWith(
      operators.filter(operator => operator.types.includes('number')),
      {
        title: 'Select an operator'
      }
    )
  })
})

describe('pickFiltersToRemove', () => {
  it('should return early if no filters are available', async () => {
    const filters: FilterDefinition[] = []
    const filter = await pickFiltersToRemove(filters)
    expect(filter).toBeUndefined()
  })

  it('should return the selected filters', async () => {
    const selectedFilters = [
      {
        operator: Operator.GREATER_THAN,
        path: epochsParam.path,
        value: '2'
      },
      {
        operator: Operator.LESS_THAN,
        path: epochsParam.path,
        value: '8'
      }
    ]
    const allFilters = [
      ...selectedFilters,
      { operator: Operator.EQUAL, path: epochsParam.path, value: '4' }
    ]
    mockedShowQuickPick.mockResolvedValueOnce(
      selectedFilters.map(filter => ({ value: filter }))
    )

    const filtersToRemove = await pickFiltersToRemove(allFilters)
    expect(filtersToRemove).toEqual(selectedFilters)
  })
})
