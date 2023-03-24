import { getCustomPlotId } from './collect'
import {
  getFullValuePath,
  CustomPlotsOrderValue,
  isCheckpointValue,
  removeColumnTypeFromPath,
  getCustomPlotPathsFromColumns,
  getCustomPlotIds,
  checkForMetricVsParamPlotOptions,
  checkForCheckpointPlotOptions
} from './custom'
import {
  FILE_SEPARATOR,
  splitColumnPath
} from '../../experiments/columns/paths'
import { pickFromColumnLikes } from '../../experiments/columns/quickPick'
import { Column, ColumnType } from '../../experiments/webview/contract'
import { definedAndNonEmpty } from '../../util/array'
import {
  quickPickManyValues,
  quickPickValue,
  QuickPickOptionsWithTitle
} from '../../vscode/quickPick'
import { Title } from '../../vscode/title'
import { Toast } from '../../vscode/toast'
import { CustomPlotType } from '../webview/contract'
import { ColumnLike } from '../../experiments/columns/like'

const getMetricVsParamPlotItem = (metric: string, param: string) => {
  const fullMetric = getFullValuePath(
    ColumnType.METRICS,
    metric,
    FILE_SEPARATOR
  )
  const fullParam = getFullValuePath(ColumnType.PARAMS, param, FILE_SEPARATOR)
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

const getCheckpointPlotItem = (metric: string) => {
  const fullMetric = getFullValuePath(
    ColumnType.METRICS,
    metric,
    FILE_SEPARATOR
  )
  const splitMetric = splitColumnPath(fullMetric)
  return {
    description: 'Checkpoint Trend Plot',
    detail: fullMetric,
    label: splitMetric[splitMetric.length - 1],
    value: getCustomPlotId(metric)
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
    isCheckpointValue(value.type)
      ? getCheckpointPlotItem(value.metric)
      : getMetricVsParamPlotItem(value.metric, value.param)
  )

  return quickPickManyValues(plotsItems, quickPickOptions)
}

export const pickCustomPlotType = (
  columns: Column[],
  customPlotOrder: CustomPlotsOrderValue[]
): Thenable<CustomPlotType | undefined> => {
  const items = []
  const isMetricVsParamAvailable = checkForMetricVsParamPlotOptions(
    columns,
    customPlotOrder
  )
  const isCheckpointAvailable = checkForCheckpointPlotOptions(
    columns,
    customPlotOrder
  )

  if (isMetricVsParamAvailable) {
    items.push({
      description:
        'A linear plot that compares a chosen metric and param with current experiments.',
      label: 'Metric Vs Param',
      value: CustomPlotType.METRIC_VS_PARAM
    })
  }

  if (isCheckpointAvailable) {
    items.push({
      description:
        'A linear plot that shows how a chosen metric changes over selected experiments.',
      label: 'Checkpoint Trend',
      value: CustomPlotType.CHECKPOINT
    })
  }

  return quickPickValue(items, {
    title: Title.SELECT_PLOT_TYPE_CUSTOM_PLOT
  })
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
  const plotIds = getCustomPlotIds(
    customPlotOrder,
    CustomPlotType.METRIC_VS_PARAM
  )

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
      getFullValuePath(ColumnType.METRICS, metric, FILE_SEPARATOR)
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
      const fullPath = getFullValuePath(
        ColumnType.PARAMS,
        param,
        FILE_SEPARATOR
      )
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
    ColumnType.METRICS,
    FILE_SEPARATOR
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
    ColumnType.PARAMS,
    FILE_SEPARATOR
  )

  return { metric, param }
}

const getAvailableCheckpointPlotColumnLikes = (
  columns: Column[],
  customPlotOrder: CustomPlotsOrderValue[]
): ColumnLike[] => {
  const { metrics } = getCustomPlotPathsFromColumns(columns)
  const customPlotIds = getCustomPlotIds(
    customPlotOrder,
    CustomPlotType.CHECKPOINT
  )
  const columnLikes = []

  for (const metric of metrics) {
    if (!customPlotIds.has(getCustomPlotId(metric))) {
      const fullMetric = getFullValuePath(
        ColumnType.METRICS,
        metric,
        FILE_SEPARATOR
      )
      columnLikes.push(getColumnLike(fullMetric))
    }
  }

  return columnLikes
}

export const pickMetric = async (
  columns: Column[],
  customPlotOrder: CustomPlotsOrderValue[]
) => {
  const availableMetrics = getAvailableCheckpointPlotColumnLikes(
    columns,
    customPlotOrder
  )

  if (!definedAndNonEmpty(availableMetrics)) {
    return Toast.showError('There are no metrics to select from.')
  }

  const metric = await pickFromColumnLikes(availableMetrics, {
    title: Title.SELECT_METRIC_CUSTOM_PLOT
  })

  if (!metric) {
    return
  }

  return removeColumnTypeFromPath(
    metric.path,
    ColumnType.METRICS,
    FILE_SEPARATOR
  )
}
