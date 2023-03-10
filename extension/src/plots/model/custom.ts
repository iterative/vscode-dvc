import { CheckpointPlot, CustomPlot, CustomPlotType } from '../webview/contract'

type CheckpointValue = {
  type: CustomPlotType.CHECKPOINT
  metric: string
}

type MetricVsParamValue = {
  type: CustomPlotType.METRIC_VS_PARAM
  metric: string
  param: string
}

export type CustomPlotsOrderValue = CheckpointValue | MetricVsParamValue

export const isCheckpointValue = (
  value: CustomPlotsOrderValue
): value is CheckpointValue => value.type === CustomPlotType.CHECKPOINT

export const isCheckpointPlot = (plot: CustomPlot): plot is CheckpointPlot =>
  plot.type === CustomPlotType.CHECKPOINT
