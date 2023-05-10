import {
  pickExperiment,
  pickExperiments,
  pickExperimentsToPlot
} from './quickPick'
import { MAX_SELECTED_EXPERIMENTS } from './status'
import {
  quickPickLimitedValues,
  quickPickManyValues,
  quickPickValue
} from '../../vscode/quickPick'
import { Experiment } from '../webview/contract'
import { Title } from '../../vscode/title'
import { formatDate } from '../../util/date'

import { Toast } from '../../vscode/toast'

jest.mock('../../vscode/quickPick')
jest.mock('../../vscode/toast')

const mockedQuickPickLimitedValues = jest.mocked(quickPickLimitedValues)
const mockedQuickPickValue = jest.mocked(quickPickValue)
const mockedQuickPickManyValues = jest.mocked(quickPickManyValues)

const mockedToast = jest.mocked(Toast)
const mockedShowError = jest.fn()
mockedToast.showError = mockedShowError

beforeEach(() => {
  jest.resetAllMocks()
})

describe('pickExperimentsToPlot', () => {
  it('should return early given no experiments', async () => {
    const undef = await pickExperimentsToPlot([], [])
    expect(undef).toBeUndefined()
    expect(mockedQuickPickLimitedValues).not.toHaveBeenCalled()
  })

  it('should return the selected experiment', async () => {
    const selectedExperiment = {
      description: '[exp-789]',
      label: '7c366f6',
      selected: false
    }
    const mockedExperiments = [
      { description: '[exp-123]', label: '73de3fe', selected: false },
      { description: '[exp-456]', label: '0be657c', selected: true },
      selectedExperiment
    ] as Experiment[]

    mockedQuickPickLimitedValues.mockResolvedValueOnce([selectedExperiment])
    const picked = await pickExperimentsToPlot(mockedExperiments, [])

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
      Title.SELECT_EXPERIMENTS_TO_PLOT,
      { matchOnDescription: true, matchOnDetail: true }
    )
  })

  it('should fill the quick pick item details with column values', async () => {
    const selectedExperiment = {
      Created: '2022-08-19T08:17:22',
      branch: 'current',
      deps: {
        'data/data.xml': { changes: false, value: '22a1a29' }
      },
      description: '[exp-123]',
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
        description: '[exp-456]',
        id: 'exp-456',
        label: '456fsf4',
        params: {
          'params.yaml': {
            prepare: { split: 22000435560000 }
          }
        },
        selected: false
      },
      {
        Created: '2022-09-15T06:58:29',
        deps: {
          'data/data.xml': { changes: false, value: '22a1a29' }
        },
        description: '[exp-789]',
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
    const picked = await pickExperimentsToPlot(mockedExperiments, [
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
          )}, split:2.2000436e+13, data/data.xml:22a1a29`,
          label: '456fsf4',
          value: mockedExperiments[1]
        },
        {
          description: '[exp-789]',
          detail: `Created:${formatDate(
            mockedExperiments[2].Created as string
          )}, split:0.00031111100, data/data.xml:22a1a29`,
          label: '789fsf4',
          value: mockedExperiments[2]
        }
      ],
      [],
      MAX_SELECTED_EXPERIMENTS,
      Title.SELECT_EXPERIMENTS_TO_PLOT,
      { matchOnDescription: true, matchOnDetail: true }
    )
  })
})

const mockedExp1 = {
  branch: 'current',
  description: '[exp-0580a]',
  id: 'abcdefb',
  label: 'abcdefb',
  name: 'exp-0580a'
}

const mockedExp2 = {
  branch: 'current',
  description: '[exp-c54c4]',
  id: 'abcdefa',
  label: 'abcdefa',
  name: 'exp-c54c4'
}

const mockedExpList = [
  mockedExp1,
  mockedExp2,
  {
    branch: 'current',
    description: '[exp-054f1]',
    id: 'abcdef1',
    label: 'abcdef1',
    name: 'exp-054f1'
  },
  {
    branch: 'current',
    description: '[exp-ae4fa]',
    id: 'abcdef2',
    label: 'abcdef2',
    name: 'exp-ae4fa'
  },
  {
    branch: 'current',
    description: '[exp-1324e]',
    id: 'abcdef3',
    label: 'abcdef3',
    name: 'exp-1324e'
  },
  {
    branch: 'current',
    description: '[exp-3bd24]',
    id: 'abcdef4',
    label: 'abcdef4',
    name: 'exp-3bd24'
  },
  {
    branch: 'current',
    description: '[exp-5d170]',
    id: 'abcdef5',
    label: 'abcdef5',
    name: 'exp-5d170'
  },
  {
    branch: 'current',
    description: '[exp-9fe22]',
    id: 'abcdef6',
    label: 'abcdef6',
    name: 'exp-9fe22'
  },
  {
    branch: 'current',
    description: '[exp-b707b]',
    id: 'abcdef7',
    label: 'abcdef7',
    name: 'exp-b707b'
  },
  {
    branch: 'current',
    description: '[exp-47694]',
    id: 'abcdef8',
    label: 'abcdef8',
    name: 'exp-47694'
  },
  {
    branch: 'current',
    description: '[exp-59807]',
    id: 'abcdef9',
    label: 'abcdef9',
    name: 'exp-59807'
  }
]

describe('pickExperiment', () => {
  it('should return the details of the chosen experiment if one is selected by the user', async () => {
    const expectedDetails = {
      id: mockedExp1.id,
      name: mockedExp1.name
    }
    mockedQuickPickValue.mockResolvedValueOnce(expectedDetails)
    const experiment = await pickExperiment(mockedExpList, [])
    expect(experiment).toStrictEqual(expectedDetails)
  })

  it('should add columns detail to quick pick items if columns order has been provided', async () => {
    const expectedDetails = mockedExp1.id
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
          value: 'abcdefb'
        },
        {
          description: '[exp-c54c4]',
          detail: `Created:${formatDate(
            mockedExpListWithColumnData[1].Created
          )}, accuracy:0.46680000, val_loss:1.8770883`,
          label: 'abcdefa',
          value: 'abcdefa'
        },
        {
          description: '[exp-054f1]',
          detail: `Created:${formatDate(
            mockedExpListWithColumnData[2].Created
          )}, accuracy:0.55745000, val_loss:1.7749213`,
          label: 'abcdef1',
          value: 'abcdef1'
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

describe('pickExperiments', () => {
  it('should return the details of the chosen experiment if one is selected by the user', async () => {
    const expectedDetails = [
      {
        id: mockedExp1.id,
        name: mockedExp1.name
      }
    ]
    mockedQuickPickManyValues.mockResolvedValueOnce(expectedDetails)
    const experiment = await pickExperiments(mockedExpList, [])
    expect(experiment).toStrictEqual(expectedDetails)
  })

  it('should add columns detail to quick pick items if columns order has been provided', async () => {
    const expectedDetails = [mockedExp1.id, mockedExp2.id]
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
    mockedQuickPickManyValues.mockResolvedValueOnce(expectedDetails)
    const experiment = await pickExperiments(mockedExpListWithColumnData, [
      'Created',
      'metrics:summary.json:accuracy',
      'metrics:summary.json:val_loss'
    ])

    expect(mockedQuickPickManyValues).toHaveBeenCalledWith(
      [
        {
          description: '[exp-0580a]',
          detail: `Created:${formatDate(
            mockedExpListWithColumnData[0].Created
          )}, accuracy:0.37231666, val_loss:1.9979371`,
          label: 'abcdefb',
          value: 'abcdefb'
        },
        {
          description: '[exp-c54c4]',
          detail: `Created:${formatDate(
            mockedExpListWithColumnData[1].Created
          )}, accuracy:0.46680000, val_loss:1.8770883`,
          label: 'abcdefa',
          value: 'abcdefa'
        },
        {
          description: '[exp-054f1]',
          detail: `Created:${formatDate(
            mockedExpListWithColumnData[2].Created
          )}, accuracy:0.55745000, val_loss:1.7749213`,
          label: 'abcdef1',
          value: 'abcdef1'
        }
      ],
      {
        matchOnDescription: true,
        matchOnDetail: true,
        title: 'Select Experiments'
      }
    )
    expect(experiment).toStrictEqual(expectedDetails)
  })

  it('should return undefined if the user cancels the popup dialog', async () => {
    mockedQuickPickManyValues.mockResolvedValueOnce(undefined)
    const undef = await pickExperiments(mockedExpList, [])
    expect(undef).toBeUndefined()
  })

  it('should call showErrorMessage when no experiment names are provided', async () => {
    await pickExperiments([], [])
    expect(mockedShowError).toHaveBeenCalledTimes(1)
  })
})
