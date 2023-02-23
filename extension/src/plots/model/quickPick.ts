// this the right place for these functions?
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

// add toast error about missing plots or not show frontend delete button
export const pickCustomPlots = (
  plots: { metric: string; param: string }[],
  quickPickOptions: QuickPickOptionsWithTitle
): Thenable<{ metric: string; param: string }[] | undefined> => {
  const plotsItems = plots.map(({ metric, param }) => {
    const splitMetric = splitColumnPath(metric)
    const splitParam = splitColumnPath(param)
    return {
      description: `${metric} vs ${param}`,
      label: `${splitMetric[splitMetric.length - 1]} vs ${
        splitParam[splitParam.length - 1]
      }`,
      value: { metric, param } // return the "id" instead of value since we use an "id" for filtering anyway
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
    return Toast.showError('There are no metrics or params to choose from.')
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
