import { mocked } from 'ts-jest/utils'
import { pickGarbageCollectionFlags, pickExperimentName } from './quickPick'
import { quickPickManyValues, quickPickOne } from '../vscode/quickPick'
import { reportError } from '../vscode/reporting'

jest.mock('../vscode/quickPick')
jest.mock('../vscode/reporting')

const mockedReportError = mocked(reportError)
const mockedQuickPickOne = mocked(quickPickOne)
const mockedQuickPickManyValues = mocked(quickPickManyValues)

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
    mockedQuickPickOne.mockResolvedValueOnce(mockedExpName)
    const name = await pickExperimentName(Promise.resolve(mockedExpList))
    expect(name).toEqual(mockedExpName)
  })

  it('should return undefined if the user cancels the popup dialog', async () => {
    mockedQuickPickOne.mockResolvedValueOnce(undefined)
    const undef = await pickExperimentName(Promise.resolve(mockedExpList))
    expect(undef).toBeUndefined()
  })

  it('should call showErrorMessage when no experiment names are provided', async () => {
    await pickExperimentName(Promise.resolve([]))
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
