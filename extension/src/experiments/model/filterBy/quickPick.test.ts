import { FilterDefinition, getFilterId, Operator } from '.'
import { OPERATORS, pickFiltersToRemove, pickFilterToAdd } from './quickPick'
import { getInput } from '../../../vscode/inputBox'
import { appendColumnToPath, buildMetricOrParamPath } from '../../columns/paths'
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
const paramsYamlPath = buildMetricOrParamPath(ColumnType.PARAMS, paramsYaml)
const epochsParamPath = appendColumnToPath(paramsYamlPath, 'epoch')

const epochsParam = {
  firstValueType: 'number',
  hasChildren: false,
  label: 'epochs',
  parentPath: paramsYamlPath,
  path: epochsParamPath,
  type: ColumnType.PARAMS
}
const boolParam = {
  firstValueType: 'boolean',
  hasChildren: false,
  label: 'bool',
  parentPath: paramsYamlPath,
  path: appendColumnToPath(paramsYamlPath, 'bool'),
  type: ColumnType.PARAMS
}
const mixedParam = {
  firstValueType: 'number',
  hasChildren: false,
  label: 'mixed',
  parentPath: paramsYamlPath,
  path: appendColumnToPath(paramsYamlPath, 'mixed'),
  type: ColumnType.PARAMS
}

describe('pickFilterToAdd', () => {
  it('should return early if no operator is picked', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(undefined)
    const filter = await pickFilterToAdd(epochsParam)
    expect(filter).toBeUndefined()
  })

  it('should call showQuickPick with the correct operators for a mixed type param', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(undefined)
    await pickFilterToAdd(mixedParam)
    expect(mockedQuickPickValue).toHaveBeenCalledWith(
      OPERATORS.filter(({ types }) => types.includes('number')),
      {
        title: Title.SELECT_OPERATOR
      }
    )
  })

  it('should return early if no value is provided', async () => {
    mockedQuickPickValue.mockResolvedValueOnce('==')
    mockedGetInput.mockResolvedValueOnce(undefined)
    const filter = await pickFilterToAdd(epochsParam)
    expect(filter).toBeUndefined()
  })

  it('should return without asking for a value when a boolean param is selected', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(Operator.IS_TRUE)
    const filter = await pickFilterToAdd(boolParam)
    expect(filter).toStrictEqual({
      operator: Operator.IS_TRUE,
      path: boolParam.path,
      value: undefined
    })
    expect(mockedQuickPickValue).toHaveBeenCalledWith(
      OPERATORS.filter(operator => operator.types.includes('boolean')),
      {
        title: Title.SELECT_OPERATOR
      }
    )
    expect(mockedGetInput).not.toHaveBeenCalled()
  })

  it('should return a filter definition if all of the steps are completed', async () => {
    mockedQuickPickValue.mockResolvedValueOnce('==')
    mockedGetInput.mockResolvedValueOnce('5')
    const filter = await pickFilterToAdd(epochsParam)
    expect(filter).toStrictEqual({
      operator: '==',
      path: epochsParam.path,
      value: '5'
    })
    expect(mockedQuickPickValue).toHaveBeenCalledWith(
      OPERATORS.filter(operator => operator.types.includes('number')),
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
