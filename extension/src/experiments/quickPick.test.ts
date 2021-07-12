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
  const examplePath = 'params/params.yaml/epochs'
  describe('pickFromColumnData', () => {
    it('invokes a QuickPick with the correct options', async () => {
      const params = 'params'
      const paramsYamlPath = 'params/params.yaml'
      const epochsColumn = {
        group: params,
        hasChildren: false,
        maxNumber: 5,
        maxStringLength: 1,
        minNumber: 2,
        name: 'epochs',
        parentPath: paramsYamlPath,
        path: examplePath,
        types: ['number']
      }
      const paramsYamlColumn = {
        group: params,
        hasChildren: true,
        name: 'params.yaml',
        parentPath: params,
        path: paramsYamlPath
      }
      const testColumns = [epochsColumn, paramsYamlColumn]
      const title = 'Test title'
      await pickFromColumnData(testColumns, { title })
      expect(mockedShowQuickPick).toBeCalledWith(
        [
          {
            description: examplePath,
            label: 'epochs',
            value: epochsColumn
          },
          {
            description: paramsYamlPath,
            label: 'params.yaml',
            value: paramsYamlColumn
          }
        ],
        { title }
      )
    })
  })

  describe('pickSort', () => {
    it('does not invoke a quickpick if passed undefined', () => {
      const promise = pickSort(undefined)
      expect(mockedShowQuickPick).not.toBeCalled()
      return expect(promise).resolves.toBe(undefined)
    })
    it('does not invoke a quickpick if an empty array', () => {
      const promise = pickSort([])
      expect(mockedShowQuickPick).not.toBeCalled()
      return expect(promise).resolves.toBe(undefined)
    })
    it('invokes two quickpicks with the right options', async () => {
      const exampleColumn = {
        group: 'params',
        hasChildren: false,
        maxNumber: 5,
        maxStringLength: 1,
        minNumber: 2,
        name: 'epochs',
        parentPath: 'params/params.yaml',
        path: examplePath,
        types: ['number']
      }
      const exampleColumns = [exampleColumn]
      mockedShowQuickPick.mockResolvedValueOnce({
        value: exampleColumn
      } as unknown)
      mockedShowQuickPick.mockResolvedValueOnce({ value: false } as unknown)
      const resolvedPromise = await pickSort(exampleColumns)
      expect(mockedShowQuickPick).toBeCalledWith(
        [
          {
            description: examplePath,
            label: 'epochs',
            value: exampleColumn
          }
        ],
        { title: 'Select a column to sort by' }
      )
      expect(mockedShowQuickPick).toBeCalledWith(
        [
          { label: 'Ascending', value: false },
          { label: 'Descending', value: true }
        ],
        { title: 'Select a direction to sort in' }
      )
      return expect(resolvedPromise).toEqual({
        columnPath: examplePath,
        descending: false
      })
    })
  })
})
