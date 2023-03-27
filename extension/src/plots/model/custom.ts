import { getCustomPlotId } from './collect'
import { Column, ColumnType } from '../../experiments/webview/contract'
import { CheckpointPlot, CustomPlot, CustomPlotType } from '../webview/contract'
import { FILE_SEPARATOR } from '../../experiments/columns/paths'

export const CHECKPOINTS_PARAM = 'epoch'

export type CustomPlotsOrderValue = {
  type: CustomPlotType.METRIC_VS_PARAM | CustomPlotType.CHECKPOINT
  metric: string
  param: string
}

export const isCheckpointValue = (
  type: CustomPlotType.CHECKPOINT | CustomPlotType.METRIC_VS_PARAM
) => type === CustomPlotType.CHECKPOINT

export const isCheckpointPlot = (plot: CustomPlot): plot is CheckpointPlot =>
  plot.type === CustomPlotType.CHECKPOINT

export const removeColumnTypeFromPath = (columnPath: string, type: string) =>
  columnPath.startsWith(type + FILE_SEPARATOR)
    ? columnPath.slice(type.length + 1)
    : columnPath

export const getFullValuePath = (type: string, columnPath: string) =>
  type + FILE_SEPARATOR + columnPath

export const cleanupOldOrderValue = (
  value: { metric: string; param: string } | CustomPlotsOrderValue
): CustomPlotsOrderValue => ({
  // previous column paths have the "TYPE:" prefix
  metric: removeColumnTypeFromPath(value.metric, ColumnType.METRICS),
  param: removeColumnTypeFromPath(value.param, ColumnType.PARAMS),
  // previous values didn't have a type
  type: (value as CustomPlotsOrderValue).type || CustomPlotType.METRIC_VS_PARAM
})

export const getCustomPlotIds = (
  customPlotVals: CustomPlotsOrderValue[],
  customPlotType: CustomPlotType
): Set<string> => {
  const plotIds: Set<string> = new Set()

  for (const { type, metric, param } of customPlotVals) {
    if (type === customPlotType) {
      plotIds.add(getCustomPlotId(metric, param))
    }
  }

  return plotIds
}

export const getCustomPlotPathsFromColumns = (
  columns: Column[]
): { metrics: string[]; params: string[] } => {
  const metrics = []
  const params = []

  for (const { path, type } of columns) {
    if (type === ColumnType.METRICS) {
      metrics.push(removeColumnTypeFromPath(path, ColumnType.METRICS))
    } else if (type === ColumnType.PARAMS) {
      params.push(removeColumnTypeFromPath(path, ColumnType.PARAMS))
    }
  }
  return { metrics, params }
}

export const checkForMetricVsParamPlotOptions = (
  columns: Column[],
  customPlotOrder: CustomPlotsOrderValue[]
): boolean => {
  const { metrics, params } = getCustomPlotPathsFromColumns(columns)
  const plotIds = getCustomPlotIds(
    customPlotOrder,
    CustomPlotType.METRIC_VS_PARAM
  )

  for (const metric of metrics) {
    for (const param of params) {
      if (!plotIds.has(getCustomPlotId(metric, param))) {
        return true
      }
    }
  }

  return false
}

export const checkForCheckpointPlotOptions = (
  columns: Column[],
  customPlotOrder: CustomPlotsOrderValue[]
): boolean => {
  const { metrics } = getCustomPlotPathsFromColumns(columns)
  const plotIds = getCustomPlotIds(customPlotOrder, CustomPlotType.CHECKPOINT)

  return metrics.some(metric => !plotIds.has(getCustomPlotId(metric)))
}

export const checkForCustomPlotOptions = (
  columns: Column[],
  customPlotOrder: CustomPlotsOrderValue[]
) => {
  return (
    checkForCheckpointPlotOptions(columns, customPlotOrder) ||
    checkForMetricVsParamPlotOptions(columns, customPlotOrder)
  )
}
