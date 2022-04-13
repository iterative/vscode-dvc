import {
  MetricOrParam,
  MetricOrParamType
} from '../../../experiments/webview/contract'

export const metrics = [
  {
    type: MetricOrParamType.METRICS,
    name: 'loss',
    path: 'metrics:summary.json:loss'
  } as unknown as MetricOrParam,
  {
    type: MetricOrParamType.METRICS,
    name: 'accuracy',
    path: 'metrics:summary.json:accuracy'
  } as unknown as MetricOrParam,
  {
    type: MetricOrParamType.METRICS,
    name: 'val_loss',
    path: 'metrics:summary.json:val_loss'
  } as unknown as MetricOrParam,
  {
    type: MetricOrParamType.METRICS,
    name: 'val_accuracy',
    path: 'metrics:summary.json:val_accuracy'
  } as unknown as MetricOrParam
]
