import { join } from 'path'
import { mocked } from 'ts-jest/utils'
import { QuickPickOptions, window } from 'vscode'
import {
  pickGarbageCollectionFlags,
  pickExperimentName,
  pickFromParamsAndMetrics,
  pickSort,
  pickFilterToAdd,
  pickFiltersToRemove,
  operators
} from './quickPick'
import { FilterDefinition, Operator } from './model/filtering'
import { QuickPickItemWithValue } from '../vscode/quickPick'
import { getInput } from '../vscode/inputBox'

jest.mock('vscode')
jest.mock('../vscode/inputBox')

const mockedShowErrorMessage = mocked(window.showErrorMessage)
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

const mockedExpList = [
  'exp-0580a',
  'exp-c54c4',
  'exp-054f1',
  'exp-ae4fa',
  'exp-1324e',
  'exp-3bd24',
  'exp-5d170',
  'exp-9fe22',
  'exp-b707b',
  'exp-47694',
  'exp-59807'
]

const mockedExpName = 'exp-2021'

describe('pickExperimentName', () => {
  it('should return the name of the chosen experiment if one is selected by the user', async () => {
    mockedShowQuickPick.mockResolvedValueOnce(mockedExpName)
    const name = await pickExperimentName(Promise.resolve(mockedExpList))
    expect(name).toEqual(mockedExpName)
  })

  it('should return undefined if the user cancels the popup dialog', async () => {
    mockedShowQuickPick.mockResolvedValueOnce(undefined)
    const undef = await pickExperimentName(Promise.resolve(mockedExpList))
    expect(undef).toBeUndefined()
  })

  it('should call showErrorMessage when no experiment names are provided', async () => {
    await pickExperimentName(Promise.resolve([]))
    expect(mockedShowErrorMessage).toHaveBeenCalledTimes(1)
  })
})

describe('pickGarbageCollectionFlags', () => {
  it('invokes a QuickPick with the correct options', async () => {
    await pickGarbageCollectionFlags()
    expect(mockedShowQuickPick).toBeCalledWith(
      [
        {
          detail: 'Preserve Experiments derived from all Git branches',
          label: 'All Branches',
          value: '--all-branches'
        },
        {
          detail: 'Preserve Experiments derived from all Git tags',
          label: 'All Tags',
          value: '--all-tags'
        },
        {
          detail: 'Preserve Experiments derived from all Git commits',
          label: 'All Commits',
          value: '--all-commits'
        },
        {
          detail: 'Preserve all queued Experiments',
          label: 'Queued Experiments',
          value: '--queued'
        }
      ],
      {
        canPickMany: true,
        placeHolder: 'Select which Experiments to preserve'
      }
    )
  })
})

describe('Params and metrics-based QuickPicks', () => {
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
  const paramsYamlParam = {
    group: params,
    hasChildren: true,
    name: paramsYaml,
    parentPath: params,
    path: paramsYamlPath
  }
  const exampleParamsAndMetrics = [epochsParam, paramsYamlParam]

  describe('pickFromParamsAndMetrics', () => {
    it('should return early if no params or metrics are provided', async () => {
      const picked = await pickFromParamsAndMetrics([], {
        title: "can't pick from no params or metrics"
      })
      expect(picked).toBeUndefined()
    })

    it('invokes a QuickPick with the correct options', async () => {
      const title = 'Test title'
      await pickFromParamsAndMetrics(exampleParamsAndMetrics, { title })
      expect(mockedShowQuickPick).toBeCalledWith(
        [
          {
            description: epochsParamPath,
            label: 'epochs',
            value: epochsParam
          },
          {
            description: paramsYamlPath,
            label: paramsYaml,
            value: paramsYamlParam
          }
        ],
        { title }
      )
    })
  })

  describe('pickSort', () => {
    it('does not invoke a quickPick if passed undefined', async () => {
      const resolvedPromise = await pickSort(undefined)
      expect(mockedShowQuickPick).not.toBeCalled()
      expect(resolvedPromise).toBe(undefined)
    })

    it('does not invoke a quickPick if an empty array', async () => {
      const resolvedPromise = await pickSort([])
      expect(mockedShowQuickPick).not.toBeCalled()
      expect(resolvedPromise).toBe(undefined)
    })

    it('resolves with no value if canceled at param or metric select', async () => {
      mockedShowQuickPick.mockResolvedValueOnce(undefined)
      expect(await pickSort(exampleParamsAndMetrics)).toBe(undefined)
      expect(mockedShowQuickPick).toBeCalledTimes(1)
    })

    it('resolves with no value if canceled at order select', async () => {
      mockedShowQuickPick.mockResolvedValueOnce({
        value: epochsParam
      } as unknown)
      mockedShowQuickPick.mockResolvedValueOnce(undefined)
      expect(await pickSort(exampleParamsAndMetrics)).toBe(undefined)
      expect(mockedShowQuickPick).toBeCalledTimes(2)
    })

    describe('valid input', () => {
      it('invokes a descending sort with the expected quickPick calls', async () => {
        mockedShowQuickPick.mockResolvedValueOnce({
          value: epochsParam
        } as unknown)
        mockedShowQuickPick.mockResolvedValueOnce({ value: false } as unknown)
        const resolvedPromise = await pickSort(exampleParamsAndMetrics)
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
      it('invokes an ascending sort with the expected quickPick calls', async () => {
        mockedShowQuickPick.mockResolvedValueOnce({
          value: paramsYamlParam
        } as unknown)
        mockedShowQuickPick.mockResolvedValueOnce({ value: false } as unknown)
        const resolvedPromise = await pickSort(exampleParamsAndMetrics)
        expect(mockedShowQuickPick).toBeCalledTimes(2)
        expect(resolvedPromise).toEqual({
          descending: false,
          path: paramsYamlPath
        })
      })
    })
  })

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
})
