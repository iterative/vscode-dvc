import { mocked } from 'ts-jest/utils'
import { pickGarbageCollectionFlags, pickExperimentName } from './quickPick'
import { quickPickManyValues, quickPickValue } from '../vscode/quickPick'
import { reportError } from '../vscode/reporting'

jest.mock('../vscode/quickPick')
jest.mock('../vscode/reporting')

const mockedReportError = mocked(reportError)
const mockedQuickPickValue = mocked(quickPickValue)
const mockedQuickPickManyValues = mocked(quickPickManyValues)

beforeEach(() => {
  jest.resetAllMocks()
})

const mockedExpList = [
  { displayId: 'abcdefb', displayNameOrParent: '[exp-0580a]', id: 'abcdefb' },
  { displayId: 'abcdefa', displayNameOrParent: '[exp-c54c4]', id: 'abcdefa' },
  { displayId: 'abcdef1', displayNameOrParent: '[exp-054f1]', id: 'abcdef1' },
  { displayId: 'abcdef2', displayNameOrParent: '[exp-ae4fa]', id: 'abcdef2' },
  { displayId: 'abcdef3', displayNameOrParent: '[exp-1324e]', id: 'abcdef3' },
  { displayId: 'abcdef4', displayNameOrParent: '[exp-3bd24]', id: 'abcdef4' },
  { displayId: 'abcdef5', displayNameOrParent: '[exp-5d170]', id: 'abcdef5' },
  { displayId: 'abcdef6', displayNameOrParent: '[exp-9fe22]', id: 'abcdef6' },
  { displayId: 'abcdef7', displayNameOrParent: '[exp-b707b]', id: 'abcdef7' },
  { displayId: 'abcdef8', displayNameOrParent: '[exp-47694]', id: 'abcdef8' },
  { displayId: 'abcdef9', displayNameOrParent: '[exp-59807]', id: 'abcdef9' }
]

const mockedExpId = 'abcdefb'

describe('pickExperimentName', () => {
  it('should return the name of the chosen experiment if one is selected by the user', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(mockedExpId)
    const name = await pickExperimentName(mockedExpList)
    expect(name).toEqual(mockedExpId)
  })

  it('should return undefined if the user cancels the popup dialog', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(undefined)
    const undef = await pickExperimentName(mockedExpList)
    expect(undef).toBeUndefined()
  })

  it('should call showErrorMessage when no experiment names are provided', async () => {
    await pickExperimentName([])
    expect(mockedReportError).toHaveBeenCalledTimes(1)
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
