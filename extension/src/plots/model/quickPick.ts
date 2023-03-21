import { getCustomPlotId } from './collect'
import {
  getFullValuePath,
  CustomPlotsOrderValue,
  isCheckpointValue,
  removeColumnTypeFromPath,
  CHECKPOINTS_PARAM
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

export const pickCustomPlotType = (): Thenable<CustomPlotType | undefined> => {
  return quickPickValue(
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
}

const getTypeColumnLikes = (columns: Column[], columnType: ColumnType) =>
  columns
    .filter(({ type }) => type === columnType)
    .map(({ path, label }) => ({ label, path }))

const getCustomPlotIds = (
  customPlotVals: CustomPlotsOrderValue[],
  customPlotType: CustomPlotType
) => {
  const plotIds = new Set()

  for (const { type, metric, param } of customPlotVals) {
    if (type === customPlotType) {
      plotIds.add(getCustomPlotId(metric, param))
    }
  }

  return plotIds
}

const filterColumnsBasedOffCustomPlotValues = (
  columns: Column[],
  customPlotVals: CustomPlotsOrderValue[],
  customPlotType: CustomPlotType,
  knownPlotMetric: string | undefined,
  knownPlotParam?: string
) => {
  const typeToSortColumnsBy = isCheckpointValue(customPlotType)
    ? ColumnType.METRICS
    : ColumnType.PARAMS
  const typeColumnLikes = getTypeColumnLikes(columns, typeToSortColumnsBy)
  const plotIds = getCustomPlotIds(customPlotVals, customPlotType)

  return plotIds.size > 0
    ? typeColumnLikes.filter(({ path }) => {
        const metric =
          knownPlotMetric ||
          removeColumnTypeFromPath(path, ColumnType.METRICS, FILE_SEPARATOR)
        const param =
          knownPlotParam ||
          removeColumnTypeFromPath(path, ColumnType.PARAMS, FILE_SEPARATOR)

        return !plotIds.has(getCustomPlotId(metric, param))
      })
    : typeColumnLikes
}

export const pickMetricAndParam = async (
  columns: Column[],
  customPlotOrderVals: CustomPlotsOrderValue[]
) => {
  const metricColumnLikes = getTypeColumnLikes(columns, ColumnType.METRICS)
  const paramColumnLikes = getTypeColumnLikes(columns, ColumnType.PARAMS)

  if (
    !definedAndNonEmpty(metricColumnLikes) ||
    !definedAndNonEmpty(paramColumnLikes)
  ) {
    return Toast.showError('There are no metrics or params to select from.')
  }

  const metric = await pickFromColumnLikes(metricColumnLikes, {
    title: Title.SELECT_METRIC_CUSTOM_PLOT
  })

  if (!metric) {
    return
  }

  const filteredParamColumnLikes = filterColumnsBasedOffCustomPlotValues(
    columns,
    customPlotOrderVals,
    CustomPlotType.METRIC_VS_PARAM,
    removeColumnTypeFromPath(metric.path, ColumnType.METRICS, FILE_SEPARATOR)
  )
  if (!definedAndNonEmpty(filteredParamColumnLikes)) {
    return Toast.showError('There are no params to select from.')
  }

  const param = await pickFromColumnLikes(filteredParamColumnLikes, {
    title: Title.SELECT_PARAM_CUSTOM_PLOT
  })

  if (!param) {
    return
  }

  return {
    metric: removeColumnTypeFromPath(
      metric.path,
      ColumnType.METRICS,
      FILE_SEPARATOR
    ),
    param: removeColumnTypeFromPath(
      param.path,
      ColumnType.PARAMS,
      FILE_SEPARATOR
    )
  }
}

export const pickMetric = async (
  columns: Column[],
  customPlotOrder: CustomPlotsOrderValue[]
) => {
  const metricColumnLikes = filterColumnsBasedOffCustomPlotValues(
    columns,
    customPlotOrder,
    CustomPlotType.CHECKPOINT,
    undefined,
    CHECKPOINTS_PARAM
  )

  if (!definedAndNonEmpty(metricColumnLikes)) {
    return Toast.showError('There are no metrics to select from.')
  }

  const metric = await pickFromColumnLikes(metricColumnLikes, {
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
