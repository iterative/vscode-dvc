import { join } from '../../../test/util/path'
import { MetricOrParam } from '../../../experiments/webview/contract'
import { joinMetricOrParamPath } from '../../../experiments/metricsAndParams/paths'

const nestedParamsFile = join('nested', 'params.yaml')

const data: MetricOrParam[] = [
  {
    group: 'metrics',
    hasChildren: false,
    name: 'loss',
    parentPath: joinMetricOrParamPath('metrics', 'summary.json'),
    path: joinMetricOrParamPath('metrics', 'summary.json', 'loss'),
    maxStringLength: 18,
    minNumber: 1.775016188621521,
    maxNumber: 2.048856019973755,
    types: ['number']
  },
  {
    group: 'metrics',
    hasChildren: false,
    name: 'accuracy',
    parentPath: joinMetricOrParamPath('metrics', 'summary.json'),
    path: joinMetricOrParamPath('metrics', 'summary.json', 'accuracy'),
    maxStringLength: 19,
    minNumber: 0.3484833240509033,
    maxNumber: 0.5926499962806702,
    types: ['number']
  },
  {
    group: 'metrics',
    hasChildren: false,
    name: 'val_loss',
    parentPath: joinMetricOrParamPath('metrics', 'summary.json'),
    path: joinMetricOrParamPath('metrics', 'summary.json', 'val_loss'),
    maxStringLength: 18,
    minNumber: 1.7233840227127075,
    maxNumber: 1.9979370832443237,
    types: ['number']
  },
  {
    group: 'metrics',
    hasChildren: false,
    name: 'val_accuracy',
    parentPath: joinMetricOrParamPath('metrics', 'summary.json'),
    path: joinMetricOrParamPath('metrics', 'summary.json', 'val_accuracy'),
    maxStringLength: 19,
    minNumber: 0.4277999997138977,
    maxNumber: 0.6704000234603882,
    types: ['number']
  },
  {
    group: 'metrics',
    hasChildren: true,
    name: 'summary.json',
    parentPath: joinMetricOrParamPath('metrics'),
    path: joinMetricOrParamPath('metrics', 'summary.json')
  },
  {
    group: 'params',
    hasChildren: false,
    name: 'epochs',
    parentPath: joinMetricOrParamPath('params', 'params.yaml'),
    path: joinMetricOrParamPath('params', 'params.yaml', 'epochs'),
    maxStringLength: 1,
    minNumber: 2,
    maxNumber: 5,
    types: ['number']
  },
  {
    group: 'params',
    hasChildren: false,
    name: 'learning_rate',
    parentPath: joinMetricOrParamPath('params', 'params.yaml'),
    path: joinMetricOrParamPath('params', 'params.yaml', 'learning_rate'),
    maxStringLength: 6,
    minNumber: 2e-12,
    maxNumber: 2.2e-7,
    types: ['number']
  },
  {
    group: 'params',
    hasChildren: false,
    name: 'dvc_logs_dir',
    parentPath: joinMetricOrParamPath('params', 'params.yaml'),
    path: joinMetricOrParamPath('params', 'params.yaml', 'dvc_logs_dir'),
    maxStringLength: 8,
    types: ['string']
  },
  {
    group: 'params',
    hasChildren: false,
    name: 'log_file',
    parentPath: joinMetricOrParamPath('params', 'params.yaml'),
    path: joinMetricOrParamPath('params', 'params.yaml', 'log_file'),
    maxStringLength: 8,
    types: ['string']
  },
  {
    group: 'params',
    hasChildren: false,
    name: 'dropout',
    parentPath: joinMetricOrParamPath('params', 'params.yaml'),
    path: joinMetricOrParamPath('params', 'params.yaml', 'dropout'),
    maxStringLength: 5,
    minNumber: 0.122,
    maxNumber: 0.15,
    types: ['number']
  },
  {
    group: 'params',
    hasChildren: false,
    name: 'threshold',
    parentPath: joinMetricOrParamPath('params', 'params.yaml', 'process'),
    path: joinMetricOrParamPath(
      'params',
      'params.yaml',
      'process',
      'threshold'
    ),
    maxStringLength: 4,
    minNumber: 0.85,
    maxNumber: 0.86,
    types: ['number']
  },
  {
    group: 'params',
    hasChildren: false,
    name: 'test_arg',
    parentPath: joinMetricOrParamPath('params', 'params.yaml', 'process'),
    path: joinMetricOrParamPath('params', 'params.yaml', 'process', 'test_arg'),
    maxStringLength: 6,
    minNumber: 3,
    maxNumber: 3,
    types: ['string', 'number']
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
    hasChildren: true,
    name: 'params.yaml',
    parentPath: joinMetricOrParamPath('params'),
    path: joinMetricOrParamPath('params', 'params.yaml')
  },
  {
    group: 'params',
    hasChildren: false,
    name: 'test',
    parentPath: joinMetricOrParamPath('params', nestedParamsFile),
    path: joinMetricOrParamPath('params', nestedParamsFile, 'test'),
    maxStringLength: 4,
    types: ['boolean']
  },
  {
    group: 'params',
    hasChildren: true,
    name: nestedParamsFile,
    parentPath: joinMetricOrParamPath('params'),
    path: joinMetricOrParamPath('params', nestedParamsFile)
  }
]

export default data
