import { CustomPlotsOrderValue } from './custom'
import { pickCustomPlots, pickMetricAndParam } from './quickPick'
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
      'custom-metrics:summary.json:loss-params:params.yaml:dropout',
      'custom-metrics:summary.json:accuracy-params:params.yaml:epochs'
    ]
    const mockedExperiments = [
      {
        metric: 'metrics:summary.json:loss',
        param: 'params:params.yaml:dropout',
        type: CustomPlotType.METRIC_VS_PARAM
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
      mockedExperiments,
      'There are no plots to remove.',
      { title: Title.SELECT_CUSTOM_PLOTS_TO_REMOVE }
    )

    expect(picked).toStrictEqual(selectedPlots)
    expect(mockedQuickPickManyValues).toHaveBeenCalledTimes(1)
    expect(mockedQuickPickManyValues).toHaveBeenCalledWith(
      [
        {
          description:
            'metrics:summary.json:loss vs params:params.yaml:dropout',
          label: 'loss vs dropout',
          value: 'custom-metrics:summary.json:loss-params:params.yaml:dropout'
        },
        {
          description:
            'metrics:summary.json:accuracy vs params:params.yaml:epochs',
          label: 'accuracy vs epochs',
          value:
            'custom-metrics:summary.json:accuracy-params:params.yaml:epochs'
        },
        {
          description:
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

describe('pickMetricAndParam', () => {
  it('should end early if there are no metrics or params available', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(undefined)
    const undef = await pickMetricAndParam([])
    expect(undef).toBeUndefined()
    expect(mockedShowError).toHaveBeenCalledTimes(1)
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
