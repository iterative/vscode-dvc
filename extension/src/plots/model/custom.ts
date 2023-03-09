import { CustomPlotType } from '../webview/contract'

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
