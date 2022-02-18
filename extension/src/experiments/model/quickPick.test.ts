import { QuickPickItemKind } from 'vscode'
import { ExperimentWithCheckpoints } from '.'
import { pickExperiments } from './quickPicks'
import { quickPickLimitedValues } from '../../vscode/quickPick'
import { Experiment } from '../webview/contract'

jest.mock('../../vscode/quickPick')

const mockedQuickPickLimitedValues = jest.mocked(quickPickLimitedValues)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('pickExperiments', () => {
  it('should return early given no experiments', async () => {
    const undef = await pickExperiments([], false)
    expect(undef).toBeUndefined()
    expect(mockedQuickPickLimitedValues).not.toBeCalled()
  })

  it('should return the selected experiment', async () => {
    const selectedExperiment = {
      displayNameOrParent: '[exp-789]',
      label: '7c366f6',
      selected: false
    }
    const mockedExperiments = [
      { displayNameOrParent: '[exp-123]', label: '73de3fe', selected: false },
      { displayNameOrParent: '[exp-456]', label: '0be657c', selected: true },
      selectedExperiment
    ] as Experiment[]

    mockedQuickPickLimitedValues.mockResolvedValueOnce([selectedExperiment])
    const picked = await pickExperiments(mockedExperiments, false)

    expect(picked).toEqual([selectedExperiment])
    expect(mockedQuickPickLimitedValues).toBeCalledTimes(1)
    expect(mockedQuickPickLimitedValues).toBeCalledWith(
      [
        {
          description: '[exp-123]',
          label: '73de3fe',
          value: mockedExperiments[0]
        },
        {
          description: '[exp-456]',
          label: '0be657c',
          value: mockedExperiments[1]
        },
        {
          description: '[exp-789]',
          label: '7c366f6',
          value: mockedExperiments[2]
        }
      ],
      [
        {
          description: '[exp-456]',
          label: '0be657c',
          value: mockedExperiments[1]
        }
      ],
      6,
      'Select up to 6 experiments'
    )
  })

  it('should send separators containing the experiment name to the quick pick when there are checkpoints', async () => {
    const selectedExperiment = {
      displayNameOrParent: '[exp-2]',
      id: 'exp-2',
      label: '7c366f6',
      selected: false
    }

    const selectedCheckpoint = {
      label: '6c366f6',
      selected: true
    }

    const mockedWorkspace = { label: 'workspace', selected: false }
    const mockedBranch = { label: 'main', selected: false }

    const mockedExp1 = {
      displayNameOrParent: '[exp-1]',
      id: 'exp-1',
      label: '73de3fe',
      selected: false
    }
    const mockedExp1Checkpoint1 = { label: '63de3fe' }
    const mockedExp1Checkpoint2 = { label: '53de3fe' }

    const mockedExp2 = selectedExperiment
    const mockedExp2Checkpoint1 = selectedCheckpoint
    const mockedExp2Checkpoint2 = { label: '5be657c' }

    mockedQuickPickLimitedValues.mockResolvedValueOnce([
      selectedExperiment,
      selectedCheckpoint
    ])

    const picked = await pickExperiments(
      [
        mockedWorkspace,
        mockedBranch,
        {
          ...mockedExp1,
          checkpoints: [mockedExp1Checkpoint1, mockedExp1Checkpoint2]
        },
        {
          ...mockedExp2,
          checkpoints: [mockedExp2Checkpoint1, mockedExp2Checkpoint2]
        }
      ] as ExperimentWithCheckpoints[],
      true
    )

    const getExpectedItem = <T extends { label: string }>(
      item: T
    ): { label: string; value: T } => ({
      label: item.label,
      value: item
    })

    expect(picked).toEqual([selectedExperiment, selectedCheckpoint])
    expect(mockedQuickPickLimitedValues).toBeCalledTimes(1)
    expect(mockedQuickPickLimitedValues).toBeCalledWith(
      [
        getExpectedItem(mockedWorkspace),
        getExpectedItem(mockedBranch),
        {
          kind: QuickPickItemKind.Separator,
          label: mockedExp1.id,
          value: undefined
        },
        getExpectedItem(mockedExp1),
        getExpectedItem(mockedExp1Checkpoint1),
        getExpectedItem(mockedExp1Checkpoint2),
        {
          kind: QuickPickItemKind.Separator,
          label: mockedExp2.id,
          value: undefined
        },
        getExpectedItem(mockedExp2),
        getExpectedItem(mockedExp2Checkpoint1),
        getExpectedItem(mockedExp2Checkpoint2)
      ],
      [getExpectedItem(selectedCheckpoint)],
      6,
      'Select up to 6 experiments'
    )
  })
})
