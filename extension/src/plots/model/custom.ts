import { CustomPlotType } from '../webview/contract'

// these names are way too lengthy
export type CustomPlotOrderCheckpointValue = {
  type: CustomPlotType.CHECKPOINT
  metric: string
}

export type CustomPlotOrderMetricVsParamValue = {
  type: CustomPlotType.METRIC_VS_PARAM
  metric: string
  param: string
}

export type CustomPlotsOrderValue =
  | CustomPlotOrderCheckpointValue
  | CustomPlotOrderMetricVsParamValue

export const isCustomPlotOrderCheckpointValue = (
  plot: CustomPlotsOrderValue
): plot is CustomPlotOrderCheckpointValue => {
  return plot.type === CustomPlotType.CHECKPOINT
}
