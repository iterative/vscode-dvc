import { getCustomPlotId } from './collect'
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

export const pickCustomPlots = (
  plots: { metric: string; param: string }[],
  quickPickOptions: QuickPickOptionsWithTitle
): Thenable<string[] | undefined> => {
  if (!definedAndNonEmpty(plots)) {
    return Toast.showError('There are no plots to remove.')
  }

  const plotsItems = plots.map(({ metric, param }) => {
    const splitMetric = splitColumnPath(metric)
    const splitParam = splitColumnPath(param)
    return {
      description: `${metric} vs ${param}`,
      label: `${splitMetric[splitMetric.length - 1]} vs ${
        splitParam[splitParam.length - 1]
      }`,
      value: getCustomPlotId(metric, param)
    }
  })

  return quickPickManyValues(plotsItems, quickPickOptions)
}

export const pickMetricAndParam = async (columns: Column[]) => {
  const metricColumnLikes = columns
    .filter(({ type }) => type === ColumnType.METRICS)
    .map(({ label, path }) => ({ label, path }))
  const paramColumnLikes = columns
    .filter(({ type }) => type === ColumnType.PARAMS)
    .map(({ label, path }) => ({ label, path }))

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
