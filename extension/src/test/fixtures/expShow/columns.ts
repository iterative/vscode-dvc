import { join } from '../../util/path'
import {
  MetricOrParam,
  MetricOrParamType
} from '../../../experiments/webview/contract'
import { joinMetricOrParamPath } from '../../../experiments/metricsAndParams/paths'

const nestedParamsFile = join('nested', 'params.yaml')

const data: MetricOrParam[] = [
  {
    type: MetricOrParamType.METRICS,
    hasChildren: true,
    name: 'summary.json',
    parentPath: joinMetricOrParamPath(MetricOrParamType.METRICS),
    path: joinMetricOrParamPath(MetricOrParamType.METRICS, 'summary.json')
  },
  {
    type: MetricOrParamType.METRICS,
    hasChildren: false,
    maxStringLength: 18,
    name: 'loss',
    parentPath: joinMetricOrParamPath(
      MetricOrParamType.METRICS,
      'summary.json'
    ),
    path: joinMetricOrParamPath(
      MetricOrParamType.METRICS,
      'summary.json',
      'loss'
    ),
    pathArray: [MetricOrParamType.METRICS, 'summary.json', 'loss'],
    types: ['number'],
    maxNumber: 2.048856019973755,
    minNumber: 1.775016188621521
  },
  {
    type: MetricOrParamType.METRICS,
    hasChildren: false,
    maxStringLength: 19,
    name: 'accuracy',
    parentPath: joinMetricOrParamPath(
      MetricOrParamType.METRICS,
      'summary.json'
    ),
    path: joinMetricOrParamPath(
      MetricOrParamType.METRICS,
      'summary.json',
      'accuracy'
    ),
    pathArray: [MetricOrParamType.METRICS, 'summary.json', 'accuracy'],
    types: ['number'],
    maxNumber: 0.5926499962806702,
    minNumber: 0.3484833240509033
  },
  {
    type: MetricOrParamType.METRICS,
    hasChildren: false,
    maxStringLength: 18,
    name: 'val_loss',
    parentPath: joinMetricOrParamPath(
      MetricOrParamType.METRICS,
      'summary.json'
    ),
    path: joinMetricOrParamPath(
      MetricOrParamType.METRICS,
      'summary.json',
      'val_loss'
    ),
    pathArray: [MetricOrParamType.METRICS, 'summary.json', 'val_loss'],
    types: ['number'],
    maxNumber: 1.9979370832443237,
    minNumber: 1.7233840227127075
  },
  {
    type: MetricOrParamType.METRICS,
    hasChildren: false,
    maxStringLength: 19,
    name: 'val_accuracy',
    parentPath: joinMetricOrParamPath(
      MetricOrParamType.METRICS,
      'summary.json'
    ),
    path: joinMetricOrParamPath(
      MetricOrParamType.METRICS,
      'summary.json',
      'val_accuracy'
    ),
    pathArray: [MetricOrParamType.METRICS, 'summary.json', 'val_accuracy'],
    types: ['number'],
    maxNumber: 0.6704000234603882,
    minNumber: 0.4277999997138977
  },
  {
    type: MetricOrParamType.PARAMS,
    hasChildren: true,
    name: 'params.yaml',
    parentPath: MetricOrParamType.PARAMS,
    path: joinMetricOrParamPath(MetricOrParamType.PARAMS, 'params.yaml')
  },
  {
    type: MetricOrParamType.PARAMS,
    hasChildren: false,
    maxStringLength: 1,
    name: 'epochs',
    parentPath: joinMetricOrParamPath(MetricOrParamType.PARAMS, 'params.yaml'),
    path: joinMetricOrParamPath(
      MetricOrParamType.PARAMS,
      'params.yaml',
      'epochs'
    ),
    pathArray: [MetricOrParamType.PARAMS, 'params.yaml', 'epochs'],
    types: ['number'],
    maxNumber: 5,
    minNumber: 2
  },
  {
    type: MetricOrParamType.PARAMS,
    hasChildren: false,
    maxStringLength: 6,
    name: 'learning_rate',
    parentPath: joinMetricOrParamPath(MetricOrParamType.PARAMS, 'params.yaml'),
    path: joinMetricOrParamPath(
      MetricOrParamType.PARAMS,
      'params.yaml',
      'learning_rate'
    ),
    pathArray: [MetricOrParamType.PARAMS, 'params.yaml', 'learning_rate'],
    types: ['number'],
    maxNumber: 2.2e-7,
    minNumber: 2e-12
  },
  {
    type: MetricOrParamType.PARAMS,
    hasChildren: false,
    maxStringLength: 8,
    name: 'dvc_logs_dir',
    parentPath: joinMetricOrParamPath(MetricOrParamType.PARAMS, 'params.yaml'),
    path: joinMetricOrParamPath(
      MetricOrParamType.PARAMS,
      'params.yaml',
      'dvc_logs_dir'
    ),
    pathArray: [MetricOrParamType.PARAMS, 'params.yaml', 'dvc_logs_dir'],
    types: ['string']
  },
  {
    type: MetricOrParamType.PARAMS,
    hasChildren: false,
    maxStringLength: 8,
    name: 'log_file',
    parentPath: joinMetricOrParamPath(MetricOrParamType.PARAMS, 'params.yaml'),
    path: joinMetricOrParamPath(
      MetricOrParamType.PARAMS,
      'params.yaml',
      'log_file'
    ),
    pathArray: [MetricOrParamType.PARAMS, 'params.yaml', 'log_file'],
    types: ['string']
  },
  {
    type: MetricOrParamType.PARAMS,
    hasChildren: false,
    maxStringLength: 5,
    name: 'dropout',
    parentPath: joinMetricOrParamPath(MetricOrParamType.PARAMS, 'params.yaml'),
    path: joinMetricOrParamPath(
      MetricOrParamType.PARAMS,
      'params.yaml',
      'dropout'
    ),
    pathArray: [MetricOrParamType.PARAMS, 'params.yaml', 'dropout'],
    types: ['number'],
    maxNumber: 0.15,
    minNumber: 0.122
  },
  {
    type: MetricOrParamType.PARAMS,
    hasChildren: true,
    name: 'process',
    parentPath: joinMetricOrParamPath(MetricOrParamType.PARAMS, 'params.yaml'),
    path: joinMetricOrParamPath(
      MetricOrParamType.PARAMS,
      'params.yaml',
      'process'
    )
  },
  {
    type: MetricOrParamType.PARAMS,
    hasChildren: false,
    maxStringLength: 4,
    name: 'threshold',
    parentPath: joinMetricOrParamPath(
      MetricOrParamType.PARAMS,
      'params.yaml',
      'process'
    ),
    path: joinMetricOrParamPath(
      MetricOrParamType.PARAMS,
      'params.yaml',
      'process',
      'threshold'
    ),
    pathArray: [
      MetricOrParamType.PARAMS,
      'params.yaml',
      'process',
      'threshold'
    ],
    types: ['number'],
    maxNumber: 0.86,
    minNumber: 0.85
  },
  {
    type: MetricOrParamType.PARAMS,
    hasChildren: false,
    maxStringLength: 6,
    name: 'test_arg',
    parentPath: joinMetricOrParamPath(
      MetricOrParamType.PARAMS,
      'params.yaml',
      'process'
    ),
    path: joinMetricOrParamPath(
      MetricOrParamType.PARAMS,
      'params.yaml',
      'process',
      'test_arg'
    ),
    pathArray: [MetricOrParamType.PARAMS, 'params.yaml', 'process', 'test_arg'],
    types: ['string', 'number'],
    maxNumber: 3,
    minNumber: 3
  },
  {
    type: MetricOrParamType.PARAMS,
    hasChildren: true,
    name: nestedParamsFile,
    parentPath: MetricOrParamType.PARAMS,
    path: joinMetricOrParamPath(MetricOrParamType.PARAMS, nestedParamsFile)
  },
  {
    type: MetricOrParamType.PARAMS,
    hasChildren: false,
    maxStringLength: 4,
    name: 'test',
    parentPath: joinMetricOrParamPath(
      MetricOrParamType.PARAMS,
      nestedParamsFile
    ),
    path: joinMetricOrParamPath(
      MetricOrParamType.PARAMS,
      nestedParamsFile,
      'test'
    ),
    pathArray: [MetricOrParamType.PARAMS, nestedParamsFile, 'test'],
    types: ['boolean']
  }
]

export default data
