import {
  MetricOrParam,
  MetricOrParamGroup
} from '../../../experiments/webview/contract'

export const metrics = [
  {
    group: MetricOrParamGroup.METRICS,
    name: 'loss',
    path: 'metrics:summary.json:loss'
  } as unknown as MetricOrParam,
  {
    group: MetricOrParamGroup.METRICS,
    name: 'accuracy',
    path: 'metrics:summary.json:accuracy'
  } as unknown as MetricOrParam,
  {
    group: MetricOrParamGroup.METRICS,
    name: 'val_loss',
    path: 'metrics:summary.json:val_loss'
  } as unknown as MetricOrParam,
  {
    group: MetricOrParamGroup.METRICS,
    name: 'val_accuracy',
    path: 'metrics:summary.json:val_accuracy'
  } as unknown as MetricOrParam
]
