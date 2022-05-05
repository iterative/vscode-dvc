import { Column, ColumnType } from '../../../experiments/webview/contract'

export const metrics = [
  {
    type: ColumnType.METRICS,
    name: 'loss',
    path: 'metrics:summary.json:loss'
  } as unknown as Column,
  {
    type: ColumnType.METRICS,
    name: 'accuracy',
    path: 'metrics:summary.json:accuracy'
  } as unknown as Column,
  {
    type: ColumnType.METRICS,
    name: 'val_loss',
    path: 'metrics:summary.json:val_loss'
  } as unknown as Column,
  {
    type: ColumnType.METRICS,
    name: 'val_accuracy',
    path: 'metrics:summary.json:val_accuracy'
  } as unknown as Column
]
