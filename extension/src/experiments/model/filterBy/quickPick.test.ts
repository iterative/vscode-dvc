import { FilterDefinition, Operator } from '.'
import { operators, pickFiltersToRemove, pickFilterToAdd } from './quickPick'
import { getInput } from '../../../vscode/inputBox'
import { joinMetricOrParamPath } from '../../metricsAndParams/paths'
import { quickPickManyValues, quickPickValue } from '../../../vscode/quickPick'

jest.mock('../../../vscode/inputBox')
jest.mock('../../../vscode/quickPick')

const mockedGetInput = jest.mocked(getInput)
const mockedQuickPickManyValues = jest.mocked(quickPickManyValues)
const mockedQuickPickValue = jest.mocked(quickPickValue)

beforeEach(() => {
  jest.resetAllMocks()
})

const params = 'params'
const paramsYaml = 'params.yaml'
const paramsYamlPath = joinMetricOrParamPath(params, paramsYaml)
const epochsParamPath = joinMetricOrParamPath(paramsYamlPath, 'epochs')
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
  path: joinMetricOrParamPath(paramsYamlPath, 'bool'),
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
  path: joinMetricOrParamPath(paramsYamlPath, 'mixed'),
  types: ['number', 'string', 'boolean']
}

describe('pickFilterToAdd', () => {
  it('should return early if no param or metric is picked', async () => {
    const params = [epochsParam]
    mockedQuickPickValue.mockResolvedValueOnce(undefined)
    const filter = await pickFilterToAdd(params)
    expect(filter).toBeUndefined()
  })

  it('should return early if no operator is picked', async () => {
    const params = [epochsParam]
    mockedQuickPickValue.mockResolvedValueOnce(epochsParam)
    mockedQuickPickValue.mockResolvedValueOnce(undefined)
    const filter = await pickFilterToAdd(params)
    expect(filter).toBeUndefined()
  })

  it('should call showQuickPick with the correct operators for a mixed type param', async () => {
    const params = [mixedParam]
    mockedQuickPickValue.mockResolvedValueOnce(mixedParam)
    mockedQuickPickValue.mockResolvedValueOnce(undefined)
    await pickFilterToAdd(params)
    expect(mockedQuickPickValue).toBeCalledWith(operators, {
      title: 'Select an operator'
    })
  })

  it('should return early if no value is provided', async () => {
    const params = [epochsParam]
    mockedQuickPickValue.mockResolvedValueOnce(epochsParam)
    mockedQuickPickValue.mockResolvedValueOnce('==')
    mockedGetInput.mockResolvedValueOnce(undefined)
    const filter = await pickFilterToAdd(params)
    expect(filter).toBeUndefined()
  })

  it('should return without asking for a value when a boolean param is selected', async () => {
    const params = [boolParam]
    mockedQuickPickValue.mockResolvedValueOnce(boolParam)
    mockedQuickPickValue.mockResolvedValueOnce(Operator.IS_TRUE)
    const filter = await pickFilterToAdd(params)
    expect(filter).toEqual({
      operator: Operator.IS_TRUE,
      path: boolParam.path,
      value: undefined
    })
    expect(mockedQuickPickValue).toBeCalledWith(
      operators.filter(operator => operator.types.includes('boolean')),
      {
        title: 'Select an operator'
      }
    )
    expect(mockedGetInput).not.toBeCalled()
  })

  it('should return a filter definition if all of the steps are completed', async () => {
    const params = [epochsParam]
    mockedQuickPickValue.mockResolvedValueOnce(epochsParam)
    mockedQuickPickValue.mockResolvedValueOnce('==')
    mockedGetInput.mockResolvedValueOnce('5')
    const filter = await pickFilterToAdd(params)
    expect(filter).toEqual({
      operator: '==',
      path: epochsParam.path,
      value: '5'
    })
    expect(mockedQuickPickValue).toBeCalledWith(
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
    mockedQuickPickManyValues.mockResolvedValueOnce(selectedFilters)

    const filtersToRemove = await pickFiltersToRemove(allFilters)
    expect(filtersToRemove).toEqual(selectedFilters)
  })
})
