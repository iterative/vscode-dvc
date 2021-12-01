import { ParamOrMetric } from '../../../experiments/webview/contract'

export const metrics = [
  {
    group: 'metrics',
    name: 'loss',
    path: 'metrics:summary.json:loss'
  } as unknown as ParamOrMetric,
  {
    group: 'metrics',
    name: 'accuracy',
    path: 'metrics:summary.json:accuracy'
  } as unknown as ParamOrMetric,
  {
    group: 'metrics',
    name: 'val_loss',
    path: 'metrics:summary.json:val_loss'
  } as unknown as ParamOrMetric,
  {
    group: 'metrics',
    name: 'val_accuracy',
    path: 'metrics:summary.json:val_accuracy'
  } as unknown as ParamOrMetric
]
