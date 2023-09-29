import { join } from 'path'
import { Column, ColumnType } from '../../../../experiments/webview/contract'
import { buildMetricOrParamPath } from '../../../../experiments/columns/paths'
import { timestampColumn } from '../../../../experiments/columns/constants'

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
