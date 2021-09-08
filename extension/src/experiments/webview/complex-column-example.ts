/* eslint-disable */
import { ParamOrMetric } from './contract'

const data: ParamOrMetric[] = [
  {
    group: 'params',
    hasChildren: false,
    name: 'epochs',
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:epochs',
    maxStringLength: 1,
    minNumber: 2,
    maxNumber: 5,
    types: ['number']
  },
  {
    group: 'params',
    hasChildren: false,
    name: 'learning_rate',
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:learning_rate',
    maxStringLength: 6,
    minNumber: 2e-12,
    maxNumber: 2.2e-7,
    types: ['number']
  },
  {
    group: 'params',
    hasChildren: false,
    name: 'dvc_logs_dir',
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:dvc_logs_dir',
    maxStringLength: 8,
    types: ['string']
  },
  {
    group: 'params',
    hasChildren: false,
    name: 'log_file',
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:log_file',
    maxStringLength: 8,
    types: ['string']
  },
  {
    group: 'params',
    hasChildren: false,
    name: 'dropout',
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:dropout',
    maxStringLength: 5,
    minNumber: 0.122,
    maxNumber: 0.15,
    types: ['number']
  },
  {
    group: 'params',
    hasChildren: false,
    name: 'threshold',
    parentPath: 'params:params.yaml:process',
    path: 'params:params.yaml:process.threshold',
    maxStringLength: 4,
    minNumber: 0.85,
    maxNumber: 0.86,
    types: ['number']
  },
  {
    group: 'params',
    hasChildren: false,
    name: 'test_arg',
    parentPath: 'params:params.yaml:process',
    path: 'params:params.yaml:process.test_arg',
    maxStringLength: 6,
    minNumber: 3,
    maxNumber: 3,
    types: ['string', 'number']
  },
  {
    group: 'params',
    hasChildren: true,
    name: 'process',
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:process'
  },
  {
    group: 'params',
    hasChildren: true,
    name: 'params.yaml',
    parentPath: 'params',
    path: 'params:params.yaml'
  },
  {
    group: 'metrics',
    hasChildren: false,
    name: 'loss',
    parentPath: 'metrics:summary.json',
    path: 'metrics:summary.json:loss',
    maxStringLength: 18,
    minNumber: 1.6168506622314453,
    maxNumber: 2.048856019973755,
    types: ['number']
  },
  {
    group: 'metrics',
    hasChildren: false,
    name: 'accuracy',
    parentPath: 'metrics:summary.json',
    path: 'metrics:summary.json:accuracy',
    maxStringLength: 19,
    minNumber: 0.3484833240509033,
    maxNumber: 0.5926499962806702,
    types: ['number']
  },
  {
    group: 'metrics',
    hasChildren: false,
    name: 'val_loss',
    parentPath: 'metrics:summary.json',
    path: 'metrics:summary.json:val_loss',
    maxStringLength: 18,
    minNumber: 1.7233840227127075,
    maxNumber: 1.9979370832443237,
    types: ['number']
  },
  {
    group: 'metrics',
    hasChildren: false,
    name: 'val_accuracy',
    parentPath: 'metrics:summary.json',
    path: 'metrics:summary.json:val_accuracy',
    maxStringLength: 19,
    minNumber: 0.4277999997138977,
    maxNumber: 0.6704000234603882,
    types: ['number']
  },
  {
    group: 'metrics',
    hasChildren: true,
    name: 'summary.json',
    parentPath: 'metrics',
    path: 'metrics:summary.json'
  }
]

export default data
