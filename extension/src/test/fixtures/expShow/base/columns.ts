import { join } from 'path'
import { Column, ColumnType } from '../../../../experiments/webview/contract'
import {
  buildDepPath,
  buildMetricOrParamPath
} from '../../../../experiments/columns/paths'
import { timestampColumn } from '../../../../experiments/columns/constants'

const nestedParamsFile = join('nested', 'params.yaml')

export const dataColumnOrder: string[] = [
  'id',
  'branch',
  'commit',
  'Created',
  'metrics:summary.json:accuracy',
  'metrics:summary.json:loss',
  'metrics:summary.json:val_accuracy',
  'metrics:summary.json:val_loss',
  join('params:nested', 'params.yaml:test'),
  'params:params.yaml:code_names',
  'params:params.yaml:dropout',
  'params:params.yaml:dvc_logs_dir',
  'params:params.yaml:epochs',
  'params:params.yaml:learning_rate',
  'params:params.yaml:log_file',
  'params:params.yaml:process.test_arg',
  'params:params.yaml:process.threshold',
  join('deps:data', 'data.xml'),
  join('deps:data', 'features'),
  join('deps:data', 'prepared'),
  'deps:model.pkl',
  join('deps:src', 'evaluate.py'),
  join('deps:src', 'featurization.py'),
  join('deps:src', 'prepare.py'),
  join('deps:src', 'train.py')
]

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
    label: 'loss',
    parentPath: buildMetricOrParamPath(ColumnType.METRICS, 'summary.json'),
    path: buildMetricOrParamPath(ColumnType.METRICS, 'summary.json', 'loss'),
    pathArray: [ColumnType.METRICS, 'summary.json', 'loss'],
    firstValueType: 'number'
  },
  {
    type: ColumnType.METRICS,
    hasChildren: false,
    label: 'accuracy',
    parentPath: buildMetricOrParamPath(ColumnType.METRICS, 'summary.json'),
    path: buildMetricOrParamPath(
      ColumnType.METRICS,
      'summary.json',
      'accuracy'
    ),
    pathArray: [ColumnType.METRICS, 'summary.json', 'accuracy'],
    firstValueType: 'number'
  },
  {
    type: ColumnType.METRICS,
    hasChildren: false,
    label: 'val_loss',
    parentPath: buildMetricOrParamPath(ColumnType.METRICS, 'summary.json'),
    path: buildMetricOrParamPath(
      ColumnType.METRICS,
      'summary.json',
      'val_loss'
    ),
    pathArray: [ColumnType.METRICS, 'summary.json', 'val_loss'],
    firstValueType: 'number'
  },
  {
    type: ColumnType.METRICS,
    hasChildren: false,
    label: 'val_accuracy',
    parentPath: buildMetricOrParamPath(ColumnType.METRICS, 'summary.json'),
    path: buildMetricOrParamPath(
      ColumnType.METRICS,
      'summary.json',
      'val_accuracy'
    ),
    pathArray: [ColumnType.METRICS, 'summary.json', 'val_accuracy'],
    firstValueType: 'number'
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
    label: 'code_names',
    parentPath: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml'),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'code_names'
    ),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'code_names'],
    firstValueType: 'array'
  },
  {
    type: ColumnType.PARAMS,
    hasChildren: false,
    label: 'epochs',
    parentPath: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml'),
    path: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml', 'epochs'),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'epochs'],
    firstValueType: 'number'
  },
  {
    type: ColumnType.PARAMS,
    hasChildren: false,
    label: 'learning_rate',
    parentPath: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml'),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'learning_rate'
    ),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'learning_rate'],
    firstValueType: 'number'
  },
  {
    type: ColumnType.PARAMS,
    hasChildren: false,
    label: 'dvc_logs_dir',
    parentPath: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml'),
    path: buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'dvc_logs_dir'
    ),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'dvc_logs_dir'],
    firstValueType: 'string'
  },
  {
    type: ColumnType.PARAMS,
    hasChildren: false,
    label: 'log_file',
    parentPath: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml'),
    path: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml', 'log_file'),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'log_file'],
    firstValueType: 'string'
  },
  {
    type: ColumnType.PARAMS,
    hasChildren: false,
    label: 'dropout',
    parentPath: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml'),
    path: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml', 'dropout'),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'dropout'],
    firstValueType: 'number'
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
    firstValueType: 'number'
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
    label: 'test',
    parentPath: buildMetricOrParamPath(ColumnType.PARAMS, nestedParamsFile),
    path: buildMetricOrParamPath(ColumnType.PARAMS, nestedParamsFile, 'test'),
    pathArray: [ColumnType.PARAMS, nestedParamsFile, 'test'],
    firstValueType: 'boolean'
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
    label: 'data.xml',
    parentPath: buildDepPath('data'),
    path: buildDepPath('data', 'data.xml'),
    pathArray: [ColumnType.DEPS, join('data', 'data.xml')],
    type: ColumnType.DEPS,
    firstValueType: 'string'
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
    label: 'prepare.py',
    parentPath: buildDepPath('src'),
    path: buildDepPath('src', 'prepare.py'),
    pathArray: [ColumnType.DEPS, join('src', 'prepare.py')],
    type: ColumnType.DEPS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'prepared',
    parentPath: buildDepPath('data'),
    path: buildDepPath('data', 'prepared'),
    pathArray: [ColumnType.DEPS, join('data', 'prepared')],
    type: ColumnType.DEPS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'featurization.py',
    parentPath: buildDepPath('src'),
    path: buildDepPath('src', 'featurization.py'),
    pathArray: [ColumnType.DEPS, join('src', 'featurization.py')],
    type: ColumnType.DEPS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'features',
    parentPath: buildDepPath('data'),
    path: buildDepPath('data', 'features'),
    pathArray: [ColumnType.DEPS, join('data', 'features')],
    type: ColumnType.DEPS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'train.py',
    parentPath: buildDepPath('src'),
    path: buildDepPath('src', 'train.py'),
    pathArray: [ColumnType.DEPS, join('src', 'train.py')],
    type: ColumnType.DEPS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'model.pkl',
    parentPath: ColumnType.DEPS,
    path: buildDepPath('model.pkl'),
    pathArray: [ColumnType.DEPS, 'model.pkl'],
    type: ColumnType.DEPS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'evaluate.py',
    parentPath: buildDepPath('src'),
    path: buildDepPath('src', 'evaluate.py'),
    pathArray: [ColumnType.DEPS, join('src', 'evaluate.py')],
    type: ColumnType.DEPS,
    firstValueType: 'string'
  },
  {
    type: ColumnType.PARAMS,
    hasChildren: false,
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
    firstValueType: 'string'
  }
]

export default data
