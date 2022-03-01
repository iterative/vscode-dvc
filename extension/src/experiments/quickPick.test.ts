import { pickGarbageCollectionFlags, pickExperiment } from './quickPick'
import { quickPickManyValues, quickPickValue } from '../vscode/quickPick'
import { Toast } from '../vscode/toast'

jest.mock('../vscode/quickPick')
jest.mock('../vscode/toast')

const mockedToast = jest.mocked(Toast)
const mockedShowError = jest.fn()
mockedToast.showError = mockedShowError
const mockedQuickPickValue = jest.mocked(quickPickValue)
const mockedQuickPickManyValues = jest.mocked(quickPickManyValues)

beforeEach(() => {
  jest.resetAllMocks()
})

const mockedExp = {
  displayNameOrParent: '[exp-0580a]',
  id: 'abcdefb',
  label: 'abcdefb',
  name: 'exp-0580a'
}

const mockedExpList = [
  mockedExp,
  {
    displayNameOrParent: '[exp-c54c4]',
    id: 'abcdefa',
    label: 'abcdefa',
    name: 'exp-c54c4'
  },
  {
    displayNameOrParent: '[exp-054f1]',
    id: 'abcdef1',
    label: 'abcdef1',
    name: 'exp-054f1'
  },
  {
    displayNameOrParent: '[exp-ae4fa]',
    id: 'abcdef2',
    label: 'abcdef2',
    name: 'exp-ae4fa'
  },
  {
    displayNameOrParent: '[exp-1324e]',
    id: 'abcdef3',
    label: 'abcdef3',
    name: 'exp-1324e'
  },
  {
    displayNameOrParent: '[exp-3bd24]',
    id: 'abcdef4',
    label: 'abcdef4',
    name: 'exp-3bd24'
  },
  {
    displayNameOrParent: '[exp-5d170]',
    id: 'abcdef5',
    label: 'abcdef5',
    name: 'exp-5d170'
  },
  {
    displayNameOrParent: '[exp-9fe22]',
    id: 'abcdef6',
    label: 'abcdef6',
    name: 'exp-9fe22'
  },
  {
    displayNameOrParent: '[exp-b707b]',
    id: 'abcdef7',
    label: 'abcdef7',
    name: 'exp-b707b'
  },
  {
    displayNameOrParent: '[exp-47694]',
    id: 'abcdef8',
    label: 'abcdef8',
    name: 'exp-47694'
  },
  {
    displayNameOrParent: '[exp-59807]',
    id: 'abcdef9',
    label: 'abcdef9',
    name: 'exp-59807'
  }
]

describe('pickExperiment', () => {
  it('should return the details of the chosen experiment if one is selected by the user', async () => {
    const expectedDetails = {
      id: mockedExp.id,
      name: mockedExp.name
    }
    mockedQuickPickValue.mockResolvedValueOnce(expectedDetails)
    const experiment = await pickExperiment(mockedExpList)
    expect(experiment).toStrictEqual(expectedDetails)
  })

  it('should return undefined if the user cancels the popup dialog', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(undefined)
    const undef = await pickExperiment(mockedExpList)
    expect(undef).toBeUndefined()
  })

  it('should call showErrorMessage when no experiment names are provided', async () => {
    await pickExperiment([])
    expect(mockedShowError).toHaveBeenCalledTimes(1)
  })
})

describe('pickGarbageCollectionFlags', () => {
  it('should invoke a QuickPick with the correct options', async () => {
    await pickGarbageCollectionFlags()
    expect(mockedQuickPickManyValues).toBeCalledWith(
      [
        {
          detail: 'Preserve experiments derived from the current workspace',
          label: 'Workspace',
          picked: true,
          value: '--workspace'
        },
        {
          detail: 'Preserve experiments derived from all Git branches',
          label: 'All Branches',
          value: '--all-branches'
        },
        {
          detail: 'Preserve experiments derived from all Git tags',
          label: 'All Tags',
          value: '--all-tags'
        },
        {
          detail: 'Preserve experiments derived from all Git commits',
          label: 'All Commits',
          value: '--all-commits'
        },
        {
          detail: 'Preserve all queued experiments',
          label: 'Queued Experiments',
          value: '--queued'
        }
      ],
      {
        placeHolder: 'Select which experiments to preserve'
      }
    )
  })
})
