import { FILE_SEPARATOR } from '../../experiments/columns/paths'
import { ColumnType } from '../../experiments/webview/contract'
import { CheckpointPlot, CustomPlot, CustomPlotType } from '../webview/contract'

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

export const doesCustomPlotAlreadyExist = (
  order: CustomPlotsOrderValue[],
  metric: string,
  param = CHECKPOINTS_PARAM
) =>
  order.some(value => {
    return value.param === param && value.metric === metric
  })

const removeColumnTypeFromPath = (columnPath: string, type: string) =>
  columnPath.startsWith(type + FILE_SEPARATOR)
    ? columnPath.slice(type.length + 1)
    : columnPath

export const cleanupOldOrderValue = ({
  param,
  metric,
  type
}: CustomPlotsOrderValue): CustomPlotsOrderValue => ({
  // previous column paths have the "TYPE:" prefix
  metric: removeColumnTypeFromPath(metric, ColumnType.METRICS),
  param: removeColumnTypeFromPath(param, ColumnType.PARAMS),
  // previous values didn't have a type
  type: type || CustomPlotType.METRIC_VS_PARAM
})
