import isEmpty from 'lodash.isempty'
import { getCustomPlotId } from './collect'
import {
  getFullValuePath,
  CustomPlotsOrderValue,
  removeColumnTypeFromPath,
  getCustomPlotPathsFromColumns
} from './custom'
import { splitColumnPath } from '../../experiments/columns/paths'
import { pickFromColumnLikes } from '../../experiments/columns/quickPick'
import { Column, ColumnType } from '../../experiments/webview/contract'
import { definedAndNonEmpty } from '../../util/array'
import {
  quickPickManyValues,
  QuickPickOptionsWithTitle
} from '../../vscode/quickPick'
import { Title } from '../../vscode/title'
import { Toast } from '../../vscode/toast'

const getMetricVsParamPlotItem = (metric: string, param: string) => {
  const fullMetric = getFullValuePath(ColumnType.METRICS, metric)
  const fullParam = getFullValuePath(ColumnType.PARAMS, param)
  const splitMetric = splitColumnPath(fullMetric)
  const splitParam = splitColumnPath(fullParam)

  return {
    description: 'Metric Vs Param Plot',
    detail: `${fullMetric} vs ${fullParam}`,
    label: `${splitMetric[splitMetric.length - 1]} vs ${
      splitParam[splitParam.length - 1]
    }`,
    value: getCustomPlotId(metric, param)
  }
}

export const pickCustomPlots = (
  plotsOrderValues: CustomPlotsOrderValue[],
  noPlotsErrorMessage: string,
  quickPickOptions: QuickPickOptionsWithTitle
): Thenable<string[] | undefined> => {
  if (!definedAndNonEmpty(plotsOrderValues)) {
    return Toast.showError(noPlotsErrorMessage)
  }

  const plotsItems = plotsOrderValues.map(value =>
    getMetricVsParamPlotItem(value.metric, value.param)
  )

  return quickPickManyValues(plotsItems, quickPickOptions)
}

const getColumnLike = (path: string) => {
  const splitPath = splitColumnPath(path)
  return {
    label: splitPath[splitPath.length - 1],
    path
  }
}

type AvailableMetricVsParamPlots = { metric: string; param: string }[]

const getAvailableMetricVsParamPlots = (
  columns: Column[],
  customPlotOrder: CustomPlotsOrderValue[]
): { [key: string]: string[] } => {
  const { metrics, params } = getCustomPlotPathsFromColumns(columns)

  const allAPramsOrMetrics = [
    ...metrics.map(metric => getFullValuePath(ColumnType.METRICS, metric)),
    ...params.map(param => getFullValuePath(ColumnType.PARAMS, param))
  ]
  const anything: { [key: string]: string[] } = {}

  for (const xValue of allAPramsOrMetrics) {
    anything[xValue] = [...allAPramsOrMetrics].filter(
      yValue =>
        yValue !== xValue &&
        !customPlotOrder.some(
          ({ metric, param }) =>
            (metric === xValue && param === yValue) ||
            (metric === yValue && param === xValue)
        )
    )
  }

  return anything
}

export const pickMetricAndParam = async (
  columns: Column[],
  customPlotOrder: CustomPlotsOrderValue[]
) => {
  const availablePlots = getAvailableMetricVsParamPlots(
    columns,
    customPlotOrder
  )

  if (isEmpty(availablePlots)) {
    return Toast.showError('There are no metrics or params to select from.')
  }

  const metricColumnLikes = Object.keys(availablePlots).map(getColumnLike)
  const metricColumnLike = await pickFromColumnLikes(metricColumnLikes, {
    title: Title.SELECT_METRIC_CUSTOM_PLOT
  })

  if (!metricColumnLike) {
    return
  }

  const metric = removeColumnTypeFromPath(
    metricColumnLike.path,
    ColumnType.METRICS
  )

  const paramColumnLikes =
    availablePlots[metricColumnLike.path].map(getColumnLike)

  const paramColumnLike = await pickFromColumnLikes(paramColumnLikes, {
    title: Title.SELECT_PARAM_CUSTOM_PLOT
  })

  if (!paramColumnLike) {
    return
  }

  const param = removeColumnTypeFromPath(
    paramColumnLike.path,
    ColumnType.PARAMS
  )

  return { metric, param }
}
