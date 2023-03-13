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
