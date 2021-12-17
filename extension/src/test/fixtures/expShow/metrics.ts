import { MetricOrParam } from '../../../experiments/webview/contract'

export const metrics = [
  {
    group: 'metrics',
    name: 'loss',
    path: 'metrics:summary.json:loss'
  } as unknown as MetricOrParam,
  {
    group: 'metrics',
    name: 'accuracy',
    path: 'metrics:summary.json:accuracy'
  } as unknown as MetricOrParam,
  {
    group: 'metrics',
    name: 'val_loss',
    path: 'metrics:summary.json:val_loss'
  } as unknown as MetricOrParam,
  {
    group: 'metrics',
    name: 'val_accuracy',
    path: 'metrics:summary.json:val_accuracy'
  } as unknown as MetricOrParam
]
