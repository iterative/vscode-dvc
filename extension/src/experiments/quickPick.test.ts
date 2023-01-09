import { pickGarbageCollectionFlags, pickExperiment } from './quickPick'
import { quickPickManyValues, quickPickValue } from '../vscode/quickPick'
import { Toast } from '../vscode/toast'
import { Title } from '../vscode/title'
import { formatDate } from '../util/date'

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
    const experiment = await pickExperiment(mockedExpList, [])
    expect(experiment).toStrictEqual(expectedDetails)
  })

  it('should add columns detail to quick pick items if columns order has been provided', async () => {
    const expectedDetails = {
      id: mockedExp.id,
      name: mockedExp.name
    }
    const mockedExpListWithColumnData = [
      {
        ...mockedExpList[0],
        Created: '2022-12-02T10:48:24',
        metrics: {
          'summary.json': {
            accuracy: 0.3723166584968567,
            val_loss: 1.9979370832443237
          }
        }
      },
      {
        ...mockedExpList[1],
        Created: '2022-08-19T08:17:22',
        metrics: {
          'summary.json': {
            accuracy: 0.4668000042438507,
            val_loss: 1.8770883083343506
          }
        }
      },
      {
        ...mockedExpList[2],
        Created: '2020-12-29T15:27:01',
        metrics: {
          'summary.json': {
            accuracy: 0.557449996471405,
            val_loss: 1.7749212980270386
          }
        }
      }
    ]
    mockedQuickPickValue.mockResolvedValueOnce(expectedDetails)
    const experiment = await pickExperiment(mockedExpListWithColumnData, [
      'Created',
      'metrics:summary.json:accuracy',
      'metrics:summary.json:val_loss'
    ])

    expect(mockedQuickPickValue).toHaveBeenCalledWith(
      [
        {
          description: '[exp-0580a]',
          detail: `Created:${formatDate(
            mockedExpListWithColumnData[0].Created
          )}, accuracy:0.37231666, val_loss:1.9979371`,
          label: 'abcdefb',
          value: { id: 'abcdefb', name: 'exp-0580a' }
        },
        {
          description: '[exp-c54c4]',
          detail: `Created:${formatDate(
            mockedExpListWithColumnData[1].Created
          )}, accuracy:0.46680000, val_loss:1.8770883`,
          label: 'abcdefa',
          value: { id: 'abcdefa', name: 'exp-c54c4' }
        },
        {
          description: '[exp-054f1]',
          detail: `Created:${formatDate(
            mockedExpListWithColumnData[2].Created
          )}, accuracy:0.55745000, val_loss:1.7749213`,
          label: 'abcdef1',
          value: { id: 'abcdef1', name: 'exp-054f1' }
        }
      ],
      {
        matchOnDescription: true,
        matchOnDetail: true,
        title: 'Select an Experiment'
      }
    )
    expect(experiment).toStrictEqual(expectedDetails)
  })

  it('should return undefined if the user cancels the popup dialog', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(undefined)
    const undef = await pickExperiment(mockedExpList, [])
    expect(undef).toBeUndefined()
  })

  it('should call showErrorMessage when no experiment names are provided', async () => {
    await pickExperiment([], [])
    expect(mockedShowError).toHaveBeenCalledTimes(1)
  })
})

describe('pickGarbageCollectionFlags', () => {
  it('should invoke a QuickPick with the correct options', async () => {
    await pickGarbageCollectionFlags()
    expect(mockedQuickPickManyValues).toHaveBeenCalledWith(
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
        placeHolder: 'Select which experiments to preserve',
        title: Title.GARBAGE_COLLECT_EXPERIMENTS
      }
    )
  })
})
