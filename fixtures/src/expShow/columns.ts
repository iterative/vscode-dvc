import { join } from 'dvc/src/test/util/path'
import { MetricOrParam } from 'dvc/src/experiments/webview/contract'
import { joinMetricOrParamPath } from 'dvc/src/experiments/metricsAndParams/paths'

const nestedParamsFile = join('nested', 'params.yaml')

const data: MetricOrParam[] = [
  {
    group: 'metrics',
    hasChildren: true,
    name: 'summary.json',
    parentPath: joinMetricOrParamPath('metrics'),
    path: joinMetricOrParamPath('metrics', 'summary.json')
  },
  {
    group: 'metrics',
    hasChildren: false,
    maxStringLength: 18,
    name: 'loss',
    parentPath: joinMetricOrParamPath('metrics', 'summary.json'),
    path: joinMetricOrParamPath('metrics', 'summary.json', 'loss'),
    pathArray: ['metrics', 'summary.json', 'loss'],
    types: ['number'],
    maxNumber: 2.048856019973755,
    minNumber: 1.775016188621521
  },
  {
    group: 'metrics',
    hasChildren: false,
    maxStringLength: 19,
    name: 'accuracy',
    parentPath: joinMetricOrParamPath('metrics', 'summary.json'),
    path: joinMetricOrParamPath('metrics', 'summary.json', 'accuracy'),
    pathArray: ['metrics', 'summary.json', 'accuracy'],
    types: ['number'],
    maxNumber: 0.5926499962806702,
    minNumber: 0.3484833240509033
  },
  {
    group: 'metrics',
    hasChildren: false,
    maxStringLength: 18,
    name: 'val_loss',
    parentPath: joinMetricOrParamPath('metrics', 'summary.json'),
    path: joinMetricOrParamPath('metrics', 'summary.json', 'val_loss'),
    pathArray: ['metrics', 'summary.json', 'val_loss'],
    types: ['number'],
    maxNumber: 1.9979370832443237,
    minNumber: 1.7233840227127075
  },
  {
    group: 'metrics',
    hasChildren: false,
    maxStringLength: 19,
    name: 'val_accuracy',
    parentPath: joinMetricOrParamPath('metrics', 'summary.json'),
    path: joinMetricOrParamPath('metrics', 'summary.json', 'val_accuracy'),
    pathArray: ['metrics', 'summary.json', 'val_accuracy'],
    types: ['number'],
    maxNumber: 0.6704000234603882,
    minNumber: 0.4277999997138977
  },
  {
    group: 'params',
    hasChildren: true,
    name: 'params.yaml',
    parentPath: joinMetricOrParamPath('params'),
    path: joinMetricOrParamPath('params', 'params.yaml')
  },
  {
    group: 'params',
    hasChildren: false,
    maxStringLength: 1,
    name: 'epochs',
    parentPath: joinMetricOrParamPath('params', 'params.yaml'),
    path: joinMetricOrParamPath('params', 'params.yaml', 'epochs'),
    pathArray: ['params', 'params.yaml', 'epochs'],
    types: ['number'],
    maxNumber: 5,
    minNumber: 2
  },
  {
    group: 'params',
    hasChildren: false,
    maxStringLength: 6,
    name: 'learning_rate',
    parentPath: joinMetricOrParamPath('params', 'params.yaml'),
    path: joinMetricOrParamPath('params', 'params.yaml', 'learning_rate'),
    pathArray: ['params', 'params.yaml', 'learning_rate'],
    types: ['number'],
    maxNumber: 2.2e-7,
    minNumber: 2e-12
  },
  {
    group: 'params',
    hasChildren: false,
    maxStringLength: 8,
    name: 'dvc_logs_dir',
    parentPath: joinMetricOrParamPath('params', 'params.yaml'),
    path: joinMetricOrParamPath('params', 'params.yaml', 'dvc_logs_dir'),
    pathArray: ['params', 'params.yaml', 'dvc_logs_dir'],
    types: ['string']
  },
  {
    group: 'params',
    hasChildren: false,
    maxStringLength: 8,
    name: 'log_file',
    parentPath: joinMetricOrParamPath('params', 'params.yaml'),
    path: joinMetricOrParamPath('params', 'params.yaml', 'log_file'),
    pathArray: ['params', 'params.yaml', 'log_file'],
    types: ['string']
  },
  {
    group: 'params',
    hasChildren: false,
    maxStringLength: 5,
    name: 'dropout',
    parentPath: joinMetricOrParamPath('params', 'params.yaml'),
    path: joinMetricOrParamPath('params', 'params.yaml', 'dropout'),
    pathArray: ['params', 'params.yaml', 'dropout'],
    types: ['number'],
    maxNumber: 0.15,
    minNumber: 0.122
  },
  {
    group: 'params',
    hasChildren: true,
    name: 'process',
    parentPath: joinMetricOrParamPath('params', 'params.yaml'),
    path: joinMetricOrParamPath('params', 'params.yaml', 'process')
  },
  {
    group: 'params',
    hasChildren: false,
    maxStringLength: 4,
    name: 'threshold',
    parentPath: joinMetricOrParamPath('params', 'params.yaml', 'process'),
    path: joinMetricOrParamPath(
      'params',
      'params.yaml',
      'process',
      'threshold'
    ),
    pathArray: ['params', 'params.yaml', 'process', 'threshold'],
    types: ['number'],
    maxNumber: 0.86,
    minNumber: 0.85
  },
  {
    group: 'params',
    hasChildren: false,
    maxStringLength: 6,
    name: 'test_arg',
    parentPath: joinMetricOrParamPath('params', 'params.yaml', 'process'),
    path: joinMetricOrParamPath('params', 'params.yaml', 'process', 'test_arg'),
    pathArray: ['params', 'params.yaml', 'process', 'test_arg'],
    types: ['string', 'number'],
    maxNumber: 3,
    minNumber: 3
  },
  {
    group: 'params',
    hasChildren: true,
    name: nestedParamsFile,
    parentPath: joinMetricOrParamPath('params'),
    path: joinMetricOrParamPath('params', nestedParamsFile)
  },
  {
    group: 'params',
    hasChildren: false,
    maxStringLength: 4,
    name: 'test',
    parentPath: joinMetricOrParamPath('params', nestedParamsFile),
    path: joinMetricOrParamPath('params', nestedParamsFile, 'test'),
    pathArray: ['params', nestedParamsFile, 'test'],
    types: ['boolean']
  }
]

export default data
