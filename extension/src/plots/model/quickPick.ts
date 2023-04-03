import { getCustomPlotId } from './collect'
import {
  getFullValuePath,
  CustomPlotsOrderValue,
  removeColumnTypeFromPath,
  getCustomPlotPathsFromColumns,
  getCustomPlotIds
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

const collectMetricVsParamPlot = (
  availablePlots: AvailableMetricVsParamPlots,
  usedCustomPlotIds: Set<string>,
  plotVals: { metric: string; param: string }
) => {
  if (
    !usedCustomPlotIds.has(getCustomPlotId(plotVals.metric, plotVals.param))
  ) {
    availablePlots.push(plotVals)
  }
}

const getAvailableMetricVsParamPlots = (
  columns: Column[],
  customPlotOrder: CustomPlotsOrderValue[]
): AvailableMetricVsParamPlots => {
  const { metrics, params } = getCustomPlotPathsFromColumns(columns)
  const plotIds = getCustomPlotIds(customPlotOrder)

  const acc: AvailableMetricVsParamPlots = []

  for (const metric of metrics) {
    for (const param of params) {
      collectMetricVsParamPlot(acc, plotIds, { metric, param })
    }
  }

  return acc
}

const getMetricColumnLikes = (availablePlots: AvailableMetricVsParamPlots) => {
  const metrics = new Set(
    availablePlots.map(({ metric }) =>
      getFullValuePath(ColumnType.METRICS, metric)
    )
  )
  return [...metrics].map(getColumnLike)
}

const getParamColumnLikes = (
  availablePlots: AvailableMetricVsParamPlots,
  chosenMetric: string
) => {
  const paramColumnLikes = []

  for (const { param, metric } of availablePlots) {
    if (metric === chosenMetric) {
      const fullPath = getFullValuePath(ColumnType.PARAMS, param)
      paramColumnLikes.push(getColumnLike(fullPath))
    }
  }

  return paramColumnLikes
}

export const pickMetricAndParam = async (
  columns: Column[],
  customPlotOrder: CustomPlotsOrderValue[]
) => {
  const availablePlots = getAvailableMetricVsParamPlots(
    columns,
    customPlotOrder
  )

  if (availablePlots.length === 0) {
    return Toast.showError('There are no metrics or params to select from.')
  }

  const metricColumnLikes = getMetricColumnLikes(availablePlots)
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

  const paramColumnLikes = getParamColumnLikes(availablePlots, metric)

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
