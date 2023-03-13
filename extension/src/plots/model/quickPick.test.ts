import { CustomPlotsOrderValue } from './custom'
import {
  pickCustomPlots,
  pickCustomPlotType,
  pickMetric,
  pickMetricAndParam
} from './quickPick'
import { quickPickManyValues, quickPickValue } from '../../vscode/quickPick'
import { Title } from '../../vscode/title'
import { Toast } from '../../vscode/toast'
import { ColumnType } from '../../experiments/webview/contract'
import { CustomPlotType } from '../webview/contract'

jest.mock('../../vscode/quickPick')
jest.mock('../../vscode/toast')

const mockedQuickPickValue = jest.mocked(quickPickValue)
const mockedQuickPickManyValues = jest.mocked(quickPickManyValues)

const mockedToast = jest.mocked(Toast)
const mockedShowError = jest.fn()
mockedToast.showError = mockedShowError

beforeEach(() => {
  jest.resetAllMocks()
})

describe('pickCustomPlots', () => {
  it('should return early given no plots', async () => {
    const undef = await pickCustomPlots([], 'There are no plots to select.', {})
    expect(undef).toBeUndefined()
    expect(mockedQuickPickManyValues).not.toHaveBeenCalled()
    expect(mockedShowError).toHaveBeenCalledTimes(1)
  })

  it('should return the selected plots', async () => {
    const selectedPlots = [
      'custom-metrics:summary.json:loss-epoch',
      'custom-metrics:summary.json:accuracy-params:params.yaml:epochs'
    ]
    const mockedPlots = [
      {
        metric: 'metrics:summary.json:loss',
        param: 'epoch',
        type: CustomPlotType.CHECKPOINT
      },
      {
        metric: 'metrics:summary.json:accuracy',
        param: 'params:params.yaml:epochs',
        type: CustomPlotType.METRIC_VS_PARAM
      },
      {
        metric: 'metrics:summary.json:learning_rate',
        param: 'param:summary.json:process.threshold',
        type: CustomPlotType.METRIC_VS_PARAM
      }
    ] as CustomPlotsOrderValue[]

    mockedQuickPickManyValues.mockResolvedValueOnce(selectedPlots)
    const picked = await pickCustomPlots(
      mockedPlots,
      'There are no plots to remove.',
      { title: Title.SELECT_CUSTOM_PLOTS_TO_REMOVE }
    )

    expect(picked).toStrictEqual(selectedPlots)
    expect(mockedQuickPickManyValues).toHaveBeenCalledTimes(1)
    expect(mockedQuickPickManyValues).toHaveBeenCalledWith(
      [
        {
          description: 'Checkpoint Trend Plot',
          detail: 'metrics:summary.json:loss',
          label: 'loss',
          value: 'custom-metrics:summary.json:loss-epoch'
        },
        {
          description: 'Metric Vs Param Plot',
          detail: 'metrics:summary.json:accuracy vs params:params.yaml:epochs',
          label: 'accuracy vs epochs',
          value:
            'custom-metrics:summary.json:accuracy-params:params.yaml:epochs'
        },
        {
          description: 'Metric Vs Param Plot',
          detail:
            'metrics:summary.json:learning_rate vs param:summary.json:process.threshold',
          label: 'learning_rate vs threshold',
          value:
            'custom-metrics:summary.json:learning_rate-param:summary.json:process.threshold'
        }
      ],
      { title: Title.SELECT_CUSTOM_PLOTS_TO_REMOVE }
    )
  })
})

describe('pickCustomPlotType', () => {
  it('should return a chosen custom plot type', async () => {
    const expectedType = CustomPlotType.CHECKPOINT
    mockedQuickPickValue.mockResolvedValueOnce(expectedType)

    const picked = await pickCustomPlotType()

    expect(picked).toStrictEqual(expectedType)
    expect(mockedQuickPickValue).toHaveBeenCalledTimes(1)
    expect(mockedQuickPickValue).toHaveBeenCalledWith(
      [
        {
          description:
            'A linear plot that compares a chosen metric and param with current experiments.',
          label: 'Metric Vs Param',
          value: CustomPlotType.METRIC_VS_PARAM
        },
        {
          description:
            'A linear plot that shows how a chosen metric changes over selected experiments.',
          label: 'Checkpoint Trend',
          value: CustomPlotType.CHECKPOINT
        }
      ],
      {
        title: Title.SELECT_PLOT_TYPE_CUSTOM_PLOT
      }
    )
  })
})

describe('pickMetricAndParam', () => {
  it('should end early if there are no metrics or params available', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(undefined)
    const undef = await pickMetricAndParam([])
    expect(undef).toBeUndefined()
    expect(mockedShowError).toHaveBeenCalledTimes(1)
  })

  it('should end early if user does not select a param or a metric', async () => {
    mockedQuickPickValue
      .mockResolvedValueOnce({
        hasChildren: false,
        label: 'dropout',
        path: 'params:params.yaml:dropout',
        type: ColumnType.PARAMS
      })
      .mockResolvedValueOnce(undefined)
      .mockResolvedValue(undefined)

    const noParamSelected = await pickMetricAndParam([
      {
        hasChildren: false,
        label: 'dropout',
        path: 'params:params.yaml:dropout',
        type: ColumnType.PARAMS
      },
      {
        hasChildren: false,
        label: 'accuracy',
        path: 'summary.json:accuracy',
        type: ColumnType.METRICS
      }
    ])
    expect(noParamSelected).toBeUndefined()

    const noMetricSelected = await pickMetricAndParam([
      {
        hasChildren: false,
        label: 'dropout',
        path: 'params:params.yaml:dropout',
        type: ColumnType.PARAMS
      },
      {
        hasChildren: false,
        label: 'accuracy',
        path: 'summary.json:accuracy',
        type: ColumnType.METRICS
      }
    ])
    expect(noMetricSelected).toBeUndefined()
  })

  it('should return a metric and a param if both are selected by the user', async () => {
    const expectedMetric = {
      label: 'loss',
      path: 'metrics:summary.json:loss'
    }
    const expectedParam = {
      label: 'epochs',
      path: 'summary.json:loss-params:params.yaml:epochs'
    }
    mockedQuickPickValue
      .mockResolvedValueOnce(expectedMetric)
      .mockResolvedValueOnce(expectedParam)
    const metricAndParam = await pickMetricAndParam([
      { ...expectedMetric, hasChildren: false, type: ColumnType.METRICS },
      { ...expectedParam, hasChildren: false, type: ColumnType.PARAMS },
      {
        hasChildren: false,
        label: 'dropout',
        path: 'params:params.yaml:dropout',
        type: ColumnType.PARAMS
      },
      {
        hasChildren: false,
        label: 'accuracy',
        path: 'summary.json:accuracy',
        type: ColumnType.METRICS
      }
    ])
    expect(metricAndParam).toStrictEqual({
      metric: expectedMetric.path,
      param: expectedParam.path
    })
  })
})

describe('pickMetric', () => {
  it('should end early if there are no metrics or params available', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(undefined)
    const undef = await pickMetric([])
    expect(undef).toBeUndefined()
    expect(mockedShowError).toHaveBeenCalledTimes(1)
  })

  it('should end early if user does not select a metric', async () => {
    mockedQuickPickValue.mockResolvedValue(undefined)

    const noMetricSelected = await pickMetricAndParam([
      {
        hasChildren: false,
        label: 'dropout',
        path: 'params:params.yaml:dropout',
        type: ColumnType.PARAMS
      },
      {
        hasChildren: false,
        label: 'accuracy',
        path: 'summary.json:accuracy',
        type: ColumnType.METRICS
      }
    ])
    expect(noMetricSelected).toBeUndefined()
  })

  it('should return a metric', async () => {
    const expectedMetric = {
      label: 'loss',
      path: 'metrics:summary.json:loss'
    }
    mockedQuickPickValue.mockResolvedValueOnce(expectedMetric)
    const metric = await pickMetric([
      { ...expectedMetric, hasChildren: false, type: ColumnType.METRICS },
      {
        hasChildren: false,
        label: 'accuracy',
        path: 'summary.json:accuracy',
        type: ColumnType.METRICS
      }
    ])

    expect(metric).toStrictEqual(expectedMetric.path)
    expect(mockedQuickPickValue).toHaveBeenCalledTimes(1)
    expect(mockedQuickPickValue).toHaveBeenCalledWith(
      [
        {
          description: 'metrics:summary.json:loss',
          label: 'loss',
          value: { label: 'loss', path: 'metrics:summary.json:loss' }
        },
        {
          description: 'summary.json:accuracy',
          label: 'accuracy',
          value: { label: 'accuracy', path: 'summary.json:accuracy' }
        }
      ],
      { title: Title.SELECT_METRIC_CUSTOM_PLOT }
    )
  })
})
