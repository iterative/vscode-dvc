import { QuickPickItemKind } from 'vscode'
import { ExperimentWithCheckpoints } from '.'
import { pickExperiments } from './quickPicks'
import { MAX_SELECTED_EXPERIMENTS } from './status'
import { quickPickLimitedValues } from '../../vscode/quickPick'
import { Experiment } from '../webview/contract'
import { Title } from '../../vscode/title'
import { formatDate } from '../../util/date'

jest.mock('../../vscode/quickPick')

const mockedQuickPickLimitedValues = jest.mocked(quickPickLimitedValues)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('pickExperiments', () => {
  it('should return early given no experiments', async () => {
    const undef = await pickExperiments([], false, [])
    expect(undef).toBeUndefined()
    expect(mockedQuickPickLimitedValues).not.toHaveBeenCalled()
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
    const picked = await pickExperiments(mockedExperiments, false, [])

    expect(picked).toStrictEqual([selectedExperiment])
    expect(mockedQuickPickLimitedValues).toHaveBeenCalledTimes(1)
    expect(mockedQuickPickLimitedValues).toHaveBeenCalledWith(
      [
        {
          description: '[exp-123]',
          detail: '',
          label: '73de3fe',
          value: mockedExperiments[0]
        },
        {
          description: '[exp-456]',
          detail: '',
          label: '0be657c',
          value: mockedExperiments[1]
        },
        {
          description: '[exp-789]',
          detail: '',
          label: '7c366f6',
          value: mockedExperiments[2]
        }
      ],
      [
        {
          description: '[exp-456]',
          detail: '',
          label: '0be657c',
          value: mockedExperiments[1]
        }
      ],
      MAX_SELECTED_EXPERIMENTS,
      Title.SELECT_EXPERIMENTS
    )
  })

  it('should fill the quick pick item details with column values', async () => {
    const selectedExperiment = {
      Created: '2022-08-19T08:17:22',
      deps: {
        'data/data.xml': { changes: false, value: '22a1a29' }
      },
      displayNameOrParent: '[exp-123]',
      id: 'exp-123',
      label: '123fsf4',
      params: {
        'params.yaml': {
          prepare: { split: 0 }
        }
      },
      selected: false
    } as Experiment
    const mockedExperiments = [
      selectedExperiment,
      {
        Created: '2022-08-19T08:17:22',
        deps: {
          'data/data.xml': { changes: false, value: '22a1a29' }
        },
        displayNameOrParent: '[exp-456]',
        id: 'exp-456',
        label: '456fsf4',
        params: {
          'params.yaml': {
            prepare: { split: 2200043556 }
          }
        },
        selected: false
      },
      {
        Created: '2022-09-15T06:58:29',
        deps: {
          'data/data.xml': { changes: false, value: '22a1a29' }
        },
        displayNameOrParent: '[exp-789]',
        id: 'exp-789',
        label: '789fsf4',
        params: {
          'params.yaml': {
            prepare: { split: 0.000311111 }
          }
        },
        selected: false
      }
    ] as Experiment[]

    mockedQuickPickLimitedValues.mockResolvedValueOnce([selectedExperiment])
    const picked = await pickExperiments(mockedExperiments, false, [
      'Created',
      'params:params.yaml:prepare.split',
      'deps:data/data.xml'
    ])

    expect(picked).toStrictEqual([selectedExperiment])
    expect(mockedQuickPickLimitedValues).toHaveBeenCalledTimes(1)
    expect(mockedQuickPickLimitedValues).toHaveBeenCalledWith(
      [
        {
          description: '[exp-123]',
          detail: `Created:${formatDate(
            mockedExperiments[0].Created as string
          )}, split:0, data/data.xml:22a1a29`,
          label: '123fsf4',
          value: mockedExperiments[0]
        },
        {
          description: '[exp-456]',
          detail: `Created:${formatDate(
            mockedExperiments[1].Created as string
          )}, split:2.2000e+9, data/data.xml:22a1a29`,
          label: '456fsf4',
          value: mockedExperiments[1]
        },
        {
          description: '[exp-789]',
          detail: `Created:${formatDate(
            mockedExperiments[2].Created as string
          )}, split:0.00031111, data/data.xml:22a1a29`,
          label: '789fsf4',
          value: mockedExperiments[2]
        }
      ],
      [],
      MAX_SELECTED_EXPERIMENTS,
      Title.SELECT_EXPERIMENTS
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
      true,
      []
    )

    const getExpectedItem = <T extends { label: string }>(
      item: T
    ): { label: string; value: T; detail: string } => ({
      detail: '',
      label: item.label,
      value: item
    })

    expect(picked).toStrictEqual([selectedExperiment, selectedCheckpoint])
    expect(mockedQuickPickLimitedValues).toHaveBeenCalledTimes(1)
    expect(mockedQuickPickLimitedValues).toHaveBeenCalledWith(
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
      MAX_SELECTED_EXPERIMENTS,
      Title.SELECT_EXPERIMENTS
    )
  })
})
