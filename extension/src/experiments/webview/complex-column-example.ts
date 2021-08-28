/* eslint-disable sonarjs/no-duplicate-string, no-loss-of-precision */
import { join } from 'path'
import { ParamOrMetric } from './contract'

const columns: ParamOrMetric[] = [
  {
    group: 'params',
    hasChildren: false,
    maxNumber: 5,
    maxStringLength: 1,
    minNumber: 2,
    name: 'epochs',
    parentPath: join('params', 'params.yaml'),
    path: join('params', 'params.yaml', 'epochs'),
    types: ['number']
  },
  {
    group: 'params',
    hasChildren: false,
    maxNumber: 2.2e-7,
    maxStringLength: 6,
    minNumber: 2e-12,
    name: 'learning_rate',
    parentPath: join('params', 'params.yaml'),
    path: join('params', 'params.yaml', 'learning_rate'),
    types: ['number']
  },
  {
    group: 'params',
    hasChildren: false,
    maxStringLength: 8,
    name: 'dvc_logs_dir',
    parentPath: join('params', 'params.yaml'),
    path: join('params', 'params.yaml', 'dvc_logs_dir'),
    types: ['string']
  },
  {
    group: 'params',
    hasChildren: false,
    maxStringLength: 8,
    name: 'log_file',
    parentPath: join('params', 'params.yaml'),
    path: join('params', 'params.yaml', 'log_file'),
    types: ['string']
  },
  {
    group: 'params',
    hasChildren: false,
    maxNumber: 0.15,
    maxStringLength: 5,
    minNumber: 0.122,
    name: 'dropout',
    parentPath: join('params', 'params.yaml'),
    path: join('params', 'params.yaml', 'dropout'),
    types: ['number']
  },
  {
    group: 'params',
    hasChildren: false,
    maxNumber: 0.86,
    maxStringLength: 4,
    minNumber: 0.85,
    name: 'threshold',
    parentPath: join('params', 'params.yaml', 'process'),
    path: join('params', 'params.yaml', 'process', 'threshold'),
    types: ['number']
  },
  {
    group: 'params',
    hasChildren: false,
    maxNumber: 3,
    maxStringLength: 6,
    minNumber: 3,
    name: 'test_arg',
    parentPath: join('params', 'params.yaml', 'process'),
    path: join('params', 'params.yaml', 'process', 'test_arg'),
    types: ['string', 'number']
  },
  {
    group: 'params',
    hasChildren: true,
    name: 'process',
    parentPath: join('params', 'params.yaml'),
    path: join('params', 'params.yaml', 'process')
  },
  {
    group: 'params',
    hasChildren: true,
    name: 'params.yaml',
    parentPath: 'params',
    path: join('params', 'params.yaml')
  },
  {
    group: 'metrics',
    hasChildren: false,
    maxNumber: 2.048856019973755,
    maxStringLength: 18,
    minNumber: 1.6168506622314453,
    name: 'loss',
    parentPath: join('metrics', 'summary.json'),
    path: join('metrics', 'summary.json', 'loss'),
    types: ['number']
  },
  {
    group: 'metrics',
    hasChildren: false,
    maxNumber: 0.5926499962806702,
    maxStringLength: 19,
    minNumber: 0.3484833240509033,
    name: 'accuracy',
    parentPath: join('metrics', 'summary.json'),
    path: join('metrics', 'summary.json', 'accuracy'),
    types: ['number']
  },
  {
    group: 'metrics',
    hasChildren: false,
    maxNumber: 1.9979370832443237,
    maxStringLength: 18,
    minNumber: 1.7233840227127075,
    name: 'val_loss',
    parentPath: join('metrics', 'summary.json'),
    path: join('metrics', 'summary.json', 'val_loss'),
    types: ['number']
  },
  {
    group: 'metrics',
    hasChildren: false,
    maxNumber: 0.6704000234603882,
    maxStringLength: 19,
    minNumber: 0.4277999997138977,
    name: 'val_accuracy',
    parentPath: join('metrics', 'summary.json'),
    path: join('metrics', 'summary.json', 'val_accuracy'),
    types: ['number']
  },
  {
    group: 'metrics',
    hasChildren: true,
    name: 'summary.json',
    parentPath: 'metrics',
    path: join('metrics', 'summary.json')
  }
]
export default columns
