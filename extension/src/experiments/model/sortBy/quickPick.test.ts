import { pickSortsToRemove, pickSortToAdd } from './quickPick'
import { appendColumnToPath, buildMetricOrParamPath } from '../../columns/paths'
import { quickPickManyValues, quickPickValue } from '../../../vscode/quickPick'
import { Title } from '../../../vscode/title'
import { ColumnType } from '../../webview/contract'

jest.mock('../../../vscode/quickPick')

const mockedQuickPickManyValues = jest.mocked(quickPickManyValues)
const mockedQuickPickValue = jest.mocked(quickPickValue)

beforeEach(() => {
  jest.resetAllMocks()
})

const paramsYaml = 'params.yaml'
const paramsYamlPath = buildMetricOrParamPath(ColumnType.PARAMS, paramsYaml)
const epochsParamPath = appendColumnToPath(paramsYamlPath, 'epochs')
const epochsParam = {
  hasChildren: false,
  label: 'epochs',
  maxNumber: 5,
  maxStringLength: 1,
  minNumber: 2,
  parentPath: paramsYamlPath,
  path: epochsParamPath,
  type: ColumnType.PARAMS,
  types: ['number']
}

const paramsYamlParam = {
  hasChildren: true,
  label: paramsYaml,
  parentPath: ColumnType.PARAMS,
  path: paramsYamlPath,
  type: ColumnType.PARAMS
}
const exampleColumns = [epochsParam, paramsYamlParam]

describe('pickSortToAdd', () => {
  it('should not invoke a quickPick if an empty array', async () => {
    const resolvedPromise = await pickSortToAdd([])
    expect(mockedQuickPickValue).not.toBeCalled()
    expect(resolvedPromise).toBe(undefined)
  })

  it('should resolve with no value if canceled at param or metric select', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(undefined)
    expect(await pickSortToAdd(exampleColumns)).toBe(undefined)
    expect(mockedQuickPickValue).toBeCalledTimes(1)
  })

  it('should resolve with no value if canceled at order select', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(epochsParam)
    mockedQuickPickValue.mockResolvedValueOnce(undefined)
    expect(await pickSortToAdd(exampleColumns)).toBe(undefined)
    expect(mockedQuickPickValue).toBeCalledTimes(2)
  })

  it('should invoke a descending sort with the expected quickPick calls', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(epochsParam)
    mockedQuickPickValue.mockResolvedValueOnce(false)
    const resolvedPromise = await pickSortToAdd(exampleColumns)
    expect(mockedQuickPickValue).toBeCalledTimes(2)
    expect(mockedQuickPickValue).toBeCalledWith(
      [
        { label: 'Ascending', value: false },
        { label: 'Descending', value: true }
      ],
      { title: Title.SELECT_SORT_DIRECTION }
    )
    expect(resolvedPromise).toStrictEqual({
      descending: false,
      path: epochsParamPath
    })
  })

  it('should invoke an ascending sort with the expected quickPick calls', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(paramsYamlParam)
    mockedQuickPickValue.mockResolvedValueOnce(false)
    const resolvedPromise = await pickSortToAdd(exampleColumns)
    expect(mockedQuickPickValue).toBeCalledTimes(2)
    expect(resolvedPromise).toStrictEqual({
      descending: false,
      path: paramsYamlPath
    })
  })
})

describe('pickSortsToRemove', () => {
  it('should return early if no sorts are available', async () => {
    const sort = await pickSortsToRemove([])
    expect(sort).toBeUndefined()
  })

  it('should return the selected sorts', async () => {
    const selectedSorts = [
      {
        descending: true,
        path: paramsYamlParam.path
      }
    ]
    const allSorts = [
      ...selectedSorts,
      { descending: false, path: epochsParam.path }
    ]
    mockedQuickPickManyValues.mockResolvedValueOnce(selectedSorts)

    const sortsToRemove = await pickSortsToRemove(allSorts)
    expect(sortsToRemove).toStrictEqual(selectedSorts)
  })
})
