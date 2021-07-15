import { mocked } from 'ts-jest/utils'
import { QuickPickOptions, window } from 'vscode'
import {
  pickGarbageCollectionFlags,
  pickExperimentName,
  pickFromColumnData,
  pickSort
} from './quickPick'
import { QuickPickItemWithValue } from '../vscode/quickPick'

jest.mock('vscode')

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

describe('Column-based QuickPicks', () => {
  const params = 'params'
  const paramsYaml = 'params.yaml'
  const paramsYamlPath = 'params/params.yaml'
  const epochsParamPath = 'params/params.yaml/epochs'
  const epochsColumn = {
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
  const paramsYamlColumn = {
    group: params,
    hasChildren: true,
    name: paramsYaml,
    parentPath: params,
    path: paramsYamlPath
  }
  const exampleColumns = [epochsColumn, paramsYamlColumn]

  describe('pickFromColumnData', () => {
    it('invokes a QuickPick with the correct options', async () => {
      const title = 'Test title'
      await pickFromColumnData(exampleColumns, { title })
      expect(mockedShowQuickPick).toBeCalledWith(
        [
          {
            description: epochsParamPath,
            label: 'epochs',
            value: epochsColumn
          },
          {
            description: paramsYamlPath,
            label: paramsYaml,
            value: paramsYamlColumn
          }
        ],
        { title }
      )
    })
  })

  describe('pickSort', () => {
    it('does not invoke a quickpick if passed undefined', async () => {
      const resolvedPromise = await pickSort(undefined)
      expect(mockedShowQuickPick).not.toBeCalled()
      expect(resolvedPromise).toBe(undefined)
    })

    it('does not invoke a quickpick if an empty array', async () => {
      const resolvedPromise = await pickSort([])
      expect(mockedShowQuickPick).not.toBeCalled()
      expect(resolvedPromise).toBe(undefined)
    })

    it('resolves with no value if canceled at column select', async () => {
      mockedShowQuickPick.mockResolvedValueOnce(undefined)
      expect(await pickSort(exampleColumns)).toBe(undefined)
      expect(mockedShowQuickPick).toBeCalledTimes(1)
    })

    it('resolves with no value if canceled at order select', async () => {
      mockedShowQuickPick.mockResolvedValueOnce({
        value: epochsColumn
      } as unknown)
      mockedShowQuickPick.mockResolvedValueOnce(undefined)
      expect(await pickSort(exampleColumns)).toBe(undefined)
      expect(mockedShowQuickPick).toBeCalledTimes(2)
    })

    describe('valid input', () => {
      it('invokes a descending sort with the expected quickpick calls', async () => {
        mockedShowQuickPick.mockResolvedValueOnce({
          value: epochsColumn
        } as unknown)
        mockedShowQuickPick.mockResolvedValueOnce({ value: false } as unknown)
        const resolvedPromise = await pickSort(exampleColumns)
        expect(mockedShowQuickPick).toBeCalledTimes(2)
        expect(mockedShowQuickPick).toBeCalledWith(
          [
            { label: 'Ascending', value: false },
            { label: 'Descending', value: true }
          ],
          { title: 'Select a direction to sort in' }
        )
        expect(resolvedPromise).toEqual({
          columnPath: epochsParamPath,
          descending: false
        })
      })
      it('invokes an ascending sort with the expected quickpick calls', async () => {
        mockedShowQuickPick.mockResolvedValueOnce({
          value: paramsYamlColumn
        } as unknown)
        mockedShowQuickPick.mockResolvedValueOnce({ value: false } as unknown)
        const resolvedPromise = await pickSort(exampleColumns)
        expect(mockedShowQuickPick).toBeCalledTimes(2)
        expect(resolvedPromise).toEqual({
          columnPath: paramsYamlPath,
          descending: false
        })
      })
    })
  })
})
