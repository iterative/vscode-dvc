import { join } from '../../util/path'
import { Column, ColumnType } from '../../../experiments/webview/contract'
import {
  buildDepPath,
  buildMetricOrParamPath
} from '../../../experiments/columns/paths'
import { timestampColumn } from '../../../experiments/columns/constants'

const nestedParamsFile = join('nested', 'params.yaml')

const data: Column[] = [
  timestampColumn,
  {
    type: ColumnType.METRICS,
    hasChildren: true,
    label: 'summary.json',
    parentPath: buildMetricOrParamPath(ColumnType.METRICS),
    path: buildMetricOrParamPath(ColumnType.METRICS, 'summary.json')
  },
  {
    type: ColumnType.METRICS,
    hasChildren: false,
    maxStringLength: 18,
    label: 'loss',
    parentPath: buildMetricOrParamPath(ColumnType.METRICS, 'summary.json'),
    path: buildMetricOrParamPath(ColumnType.METRICS, 'summary.json', 'loss'),
    pathArray: [ColumnType.METRICS, 'summary.json', 'loss'],
    types: ['number'],
    maxNumber: 2.048856019973755,
    minNumber: 1.775016188621521
  },
  {
    type: ColumnType.METRICS,
    hasChildren: false,
    maxStringLength: 19,
    label: 'accuracy',
    parentPath: buildMetricOrParamPath(ColumnType.METRICS, 'summary.json'),
    path: buildMetricOrParamPath(
      ColumnType.METRICS,
      'summary.json',
      'accuracy'
    ),
    pathArray: [ColumnType.METRICS, 'summary.json', 'accuracy'],
    types: ['number'],
    maxNumber: 0.5926499962806702,
    minNumber: 0.3484833240509033
  },
  {
    type: ColumnType.METRICS,
    hasChildren: false,
    maxStringLength: 18,
    label: 'val_loss',
    parentPath: buildMetricOrParamPath(ColumnType.METRICS, 'summary.json'),
    path: buildMetricOrParamPath(
      ColumnType.METRICS,
      'summary.json',
      'val_loss'
    ),
    pathArray: [ColumnType.METRICS, 'summary.json', 'val_loss'],
    types: ['number'],
    maxNumber: 1.9979370832443237,
    minNumber: 1.7233840227127075
  },
  {
    type: ColumnType.METRICS,
    hasChildren: false,
    maxStringLength: 19,
    label: 'val_accuracy',
    parentPath: buildMetricOrParamPath(ColumnType.METRICS, 'summary.json'),
    path: buildMetricOrParamPath(
      ColumnType.METRICS,
      'summary.json',
      'val_accuracy'
    ),
    pathArray: [ColumnType.METRICS, 'summary.json', 'val_accuracy'],
    types: ['number'],
    maxNumber: 0.6704000234603882,
    minNumber: 0.4277999997138977
  },
  {
    type: ColumnType.PARAMS,
    hasChildren: true,
    label: 'params.yaml',
    parentPath: ColumnType.PARAMS,
    path: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml')
  },
  {
    type: ColumnType.PARAMS,
    hasChildren: false,
    maxStringLength: 3,
    label: 'code_names',
    parentPath: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml'),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'code_names'
    ),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'code_names'],
    types: ['array']
  },
  {
    type: ColumnType.PARAMS,
    hasChildren: false,
    maxStringLength: 1,
    label: 'epochs',
    parentPath: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml'),
    path: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml', 'epochs'),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'epochs'],
    types: ['number'],
    maxNumber: 5,
    minNumber: 2
  },
  {
    type: ColumnType.PARAMS,
    hasChildren: false,
    maxStringLength: 6,
    label: 'learning_rate',
    parentPath: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml'),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'learning_rate'
    ),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'learning_rate'],
    types: ['number'],
    maxNumber: 2.2e-7,
    minNumber: 2e-12
  },
  {
    type: ColumnType.PARAMS,
    hasChildren: false,
    maxStringLength: 8,
    label: 'dvc_logs_dir',
    parentPath: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml'),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'dvc_logs_dir'
    ),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'dvc_logs_dir'],
    types: ['string']
  },
  {
    type: ColumnType.PARAMS,
    hasChildren: false,
    maxStringLength: 8,
    label: 'log_file',
    parentPath: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml'),
    path: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml', 'log_file'),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'log_file'],
    types: ['string']
  },
  {
    type: ColumnType.PARAMS,
    hasChildren: false,
    maxStringLength: 5,
    label: 'dropout',
    parentPath: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml'),
    path: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml', 'dropout'),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'dropout'],
    types: ['number'],
    maxNumber: 0.15,
    minNumber: 0.122
  },
  {
    type: ColumnType.PARAMS,
    hasChildren: true,
    label: 'process',
    parentPath: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml'),
    path: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml', 'process')
  },
  {
    type: ColumnType.PARAMS,
    hasChildren: false,
    maxStringLength: 4,
    label: 'threshold',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'process'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'process',
      'threshold'
    ),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'process', 'threshold'],
    types: ['number'],
    maxNumber: 0.86,
    minNumber: 0.85
  },
  {
    type: ColumnType.PARAMS,
    hasChildren: false,
    maxStringLength: 6,
    label: 'test_arg',
    parentPath: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'process'
    ),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'process',
      'test_arg'
    ),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'process', 'test_arg'],
    types: ['string', 'number'],
    maxNumber: 3,
    minNumber: 3
  },
  {
    type: ColumnType.PARAMS,
    hasChildren: true,
    label: nestedParamsFile,
    parentPath: ColumnType.PARAMS,
    path: buildMetricOrParamPath(ColumnType.PARAMS, nestedParamsFile)
  },
  {
    type: ColumnType.PARAMS,
    hasChildren: false,
    maxStringLength: 4,
    label: 'test',
    parentPath: buildMetricOrParamPath(ColumnType.PARAMS, nestedParamsFile),
    path: buildMetricOrParamPath(ColumnType.PARAMS, nestedParamsFile, 'test'),
    pathArray: [ColumnType.PARAMS, nestedParamsFile, 'test'],
    types: ['boolean']
  },
  {
    hasChildren: true,
    label: 'data',
    parentPath: ColumnType.DEPS,
    path: buildDepPath('data'),
    type: ColumnType.DEPS
  },
  {
    hasChildren: false,
    maxStringLength: 7,
    label: 'data.xml',
    parentPath: buildDepPath('data'),
    path: buildDepPath('data', 'data.xml'),
    pathArray: [ColumnType.DEPS, join('data', 'data.xml')],
    type: ColumnType.DEPS,
    types: ['string']
  },
  {
    hasChildren: true,
    label: 'src',
    parentPath: ColumnType.DEPS,
    path: buildDepPath('src'),
    type: ColumnType.DEPS
  },
  {
    hasChildren: false,
    maxStringLength: 7,
    label: 'prepare.py',
    parentPath: buildDepPath('src'),
    path: buildDepPath('src', 'prepare.py'),
    pathArray: [ColumnType.DEPS, join('src', 'prepare.py')],
    type: ColumnType.DEPS,
    types: ['string']
  },
  {
    hasChildren: false,
    maxStringLength: 7,
    label: 'prepared',
    parentPath: buildDepPath('data'),
    path: buildDepPath('data', 'prepared'),
    pathArray: [ColumnType.DEPS, join('data', 'prepared')],
    type: ColumnType.DEPS,
    types: ['string']
  },
  {
    hasChildren: false,
    maxStringLength: 7,
    label: 'featurization.py',
    parentPath: buildDepPath('src'),
    path: buildDepPath('src', 'featurization.py'),
    pathArray: [ColumnType.DEPS, join('src', 'featurization.py')],
    type: ColumnType.DEPS,
    types: ['string']
  },
  {
    hasChildren: false,
    maxStringLength: 7,
    label: 'features',
    parentPath: buildDepPath('data'),
    path: buildDepPath('data', 'features'),
    pathArray: [ColumnType.DEPS, join('data', 'features')],
    type: ColumnType.DEPS,
    types: ['string']
  },
  {
    hasChildren: false,
    maxStringLength: 7,
    label: 'train.py',
    parentPath: buildDepPath('src'),
    path: buildDepPath('src', 'train.py'),
    pathArray: [ColumnType.DEPS, join('src', 'train.py')],
    type: ColumnType.DEPS,
    types: ['string']
  },
  {
    hasChildren: false,
    maxStringLength: 7,
    label: 'model.pkl',
    parentPath: ColumnType.DEPS,
    path: buildDepPath('model.pkl'),
    pathArray: [ColumnType.DEPS, 'model.pkl'],
    type: ColumnType.DEPS,
    types: ['string']
  },
  {
    hasChildren: false,
    maxStringLength: 7,
    label: 'evaluate.py',
    parentPath: buildDepPath('src'),
    path: buildDepPath('src', 'evaluate.py'),
    pathArray: [ColumnType.DEPS, join('src', 'evaluate.py')],
    type: ColumnType.DEPS,
    types: ['string']
  }
]

export default data
