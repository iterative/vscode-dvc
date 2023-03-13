import { getCustomPlotId } from './collect'
import { CustomPlotsOrderValue, isCheckpointValue } from './custom'
import { splitColumnPath } from '../../experiments/columns/paths'
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
  const splitMetric = splitColumnPath(metric)
  const splitParam = splitColumnPath(param)
  return {
    description: 'Metric Vs Param Plot',
    detail: `${metric} vs ${param}`,
    label: `${splitMetric[splitMetric.length - 1]} vs ${
      splitParam[splitParam.length - 1]
    }`,
    value: getCustomPlotId(metric, param)
  }
}

const getCheckpointPlotItem = (metric: string) => {
  const splitMetric = splitColumnPath(metric)
  return {
    description: 'Checkpoint Trend Plot',
    detail: metric,
    label: splitMetric[splitMetric.length - 1],
    value: getCustomPlotId(metric)
  }
}

export const pickCustomPlots = (
  plots: CustomPlotsOrderValue[],
  noPlotsErrorMessage: string,
  quickPickOptions: QuickPickOptionsWithTitle
): Thenable<string[] | undefined> => {
  if (!definedAndNonEmpty(plots)) {
    return Toast.showError(noPlotsErrorMessage)
  }

  const plotsItems = plots.map(plot =>
    isCheckpointValue(plot.type)
      ? getCheckpointPlotItem(plot.metric)
      : getMetricVsParamPlotItem(plot.metric, plot.param)
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
    .map(({ label, path }) => ({ label, path }))

export const pickMetricAndParam = async (columns: Column[]) => {
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

  const param = await pickFromColumnLikes(paramColumnLikes, {
    title: Title.SELECT_PARAM_CUSTOM_PLOT
  })

  if (!param) {
    return
  }
  return { metric: metric.path, param: param.path }
}

export const pickMetric = async (columns: Column[]) => {
  const metricColumnLikes = getTypeColumnLikes(columns, ColumnType.METRICS)

  if (!definedAndNonEmpty(metricColumnLikes)) {
    return Toast.showError('There are no metrics to select from.')
  }

  const metric = await pickFromColumnLikes(metricColumnLikes, {
    title: Title.SELECT_METRIC_CUSTOM_PLOT
  })

  if (!metric) {
    return
  }

  return metric.path
}
