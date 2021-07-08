import { mocked } from 'ts-jest/utils'
import { QuickPickOptions, window } from 'vscode'
import {
  pickGarbageCollectionFlags,
  pickExperimentName,
  pickFromColumnData
} from './quickPick'
import { QuickPickItemWithValue } from '../vscode/quickPick'

jest.mock('vscode')

const mockedShowErrorMessage = mocked(window.showErrorMessage)
const mockedShowQuickPick = mocked<
  (
    items: QuickPickItemWithValue[],
    options: QuickPickOptions
  ) => Thenable<
    QuickPickItemWithValue[] | QuickPickItemWithValue | string | undefined
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
      path: 'params/params.yaml/epochs',
      types: ['number']
    }
    const testArgColumn = {
      group: params,
      hasChildren: false,
      maxNumber: 3,
      maxStringLength: 6,
      minNumber: 3,
      name: 'test_arg',
      parentPath: 'params/params.yaml/process',
      path: 'params/params.yaml/process/test_arg',
      types: ['string', 'number']
    }
    const paramsYamlColumn = {
      group: params,
      hasChildren: true,
      name: 'params.yaml',
      parentPath: params,
      path: paramsYamlPath
    }
    const testColumns = [epochsColumn, testArgColumn, paramsYamlColumn]
    const title = 'Test title'
    await pickFromColumnData(testColumns, { title })
    expect(mockedShowQuickPick).toBeCalledWith(
      [
        {
          description: 'params/params.yaml/epochs',
          label: 'epochs',
          value: epochsColumn
        },
        {
          description: 'params/params.yaml/process/test_arg',
          label: 'test_arg',
          value: testArgColumn
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
