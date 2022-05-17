import { FilterDefinition, getFilterId, Operator } from '.'
import { operators, pickFiltersToRemove, pickFilterToAdd } from './quickPick'
import { getInput } from '../../../vscode/inputBox'
import { appendColumnToPath, joinColumnPath } from '../../columns/paths'
import { quickPickManyValues, quickPickValue } from '../../../vscode/quickPick'
import { Title } from '../../../vscode/title'
import { ColumnType } from '../../webview/contract'

jest.mock('../../../vscode/inputBox')
jest.mock('../../../vscode/quickPick')

const mockedGetInput = jest.mocked(getInput)
const mockedQuickPickManyValues = jest.mocked(quickPickManyValues)
const mockedQuickPickValue = jest.mocked(quickPickValue)

beforeEach(() => {
  jest.resetAllMocks()
})

const paramsYaml = 'params.yaml'
const paramsYamlPath = joinColumnPath(ColumnType.PARAMS, paramsYaml)
const epochsParamPath = appendColumnToPath(paramsYamlPath, 'epoch')

const epochsParam = {
  hasChildren: false,
  maxNumber: 5,
  maxStringLength: 1,
  minNumber: 2,
  name: 'epochs',
  parentPath: paramsYamlPath,
  path: epochsParamPath,
  type: ColumnType.PARAMS,
  types: ['number']
}
const boolParam = {
  hasChildren: false,
  maxNumber: 1,
  maxStringLength: 1,
  minNumber: 0,
  name: 'bool',
  parentPath: paramsYamlPath,
  path: appendColumnToPath(paramsYamlPath, 'bool'),
  type: ColumnType.PARAMS,
  types: ['boolean']
}
const mixedParam = {
  hasChildren: false,
  maxNumber: 5,
  maxStringLength: 44,
  minNumber: 2,
  name: 'mixed',
  parentPath: paramsYamlPath,
  path: appendColumnToPath(paramsYamlPath, 'mixed'),
  type: ColumnType.PARAMS,
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
      title: Title.SELECT_OPERATOR
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
    expect(filter).toStrictEqual({
      operator: Operator.IS_TRUE,
      path: boolParam.path,
      value: undefined
    })
    expect(mockedQuickPickValue).toBeCalledWith(
      operators.filter(operator => operator.types.includes('boolean')),
      {
        title: Title.SELECT_OPERATOR
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
    expect(filter).toStrictEqual({
      operator: '==',
      path: epochsParam.path,
      value: '5'
    })
    expect(mockedQuickPickValue).toBeCalledWith(
      operators.filter(operator => operator.types.includes('number')),
      {
        title: Title.SELECT_OPERATOR
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

    const selectedIds = selectedFilters.map(filter => getFilterId(filter))

    mockedQuickPickManyValues.mockResolvedValueOnce(selectedIds)

    const filtersToRemove = await pickFiltersToRemove(allFilters)
    expect(filtersToRemove).toStrictEqual(selectedIds)
  })
})
