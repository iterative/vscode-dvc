import { join } from '../../util/path'
import { Column, ColumnType } from '../../../experiments/webview/contract'
import { joinColumnPath } from '../../../experiments/columns/paths'

const nestedParamsFile = join('nested', 'params.yaml')

const data: Column[] = [
  {
    type: ColumnType.METRICS,
    hasChildren: true,
    name: 'summary.json',
    parentPath: joinColumnPath(ColumnType.METRICS),
    path: joinColumnPath(ColumnType.METRICS, 'summary.json')
  },
  {
    type: ColumnType.METRICS,
    hasChildren: false,
    maxStringLength: 18,
    name: 'loss',
    parentPath: joinColumnPath(ColumnType.METRICS, 'summary.json'),
    path: joinColumnPath(ColumnType.METRICS, 'summary.json', 'loss'),
    pathArray: [ColumnType.METRICS, 'summary.json', 'loss'],
    types: ['number'],
    maxNumber: 2.048856019973755,
    minNumber: 1.775016188621521
  },
  {
    type: ColumnType.METRICS,
    hasChildren: false,
    maxStringLength: 19,
    name: 'accuracy',
    parentPath: joinColumnPath(ColumnType.METRICS, 'summary.json'),
    path: joinColumnPath(ColumnType.METRICS, 'summary.json', 'accuracy'),
    pathArray: [ColumnType.METRICS, 'summary.json', 'accuracy'],
    types: ['number'],
    maxNumber: 0.5926499962806702,
    minNumber: 0.3484833240509033
  },
  {
    type: ColumnType.METRICS,
    hasChildren: false,
    maxStringLength: 18,
    name: 'val_loss',
    parentPath: joinColumnPath(ColumnType.METRICS, 'summary.json'),
    path: joinColumnPath(ColumnType.METRICS, 'summary.json', 'val_loss'),
    pathArray: [ColumnType.METRICS, 'summary.json', 'val_loss'],
    types: ['number'],
    maxNumber: 1.9979370832443237,
    minNumber: 1.7233840227127075
  },
  {
    type: ColumnType.METRICS,
    hasChildren: false,
    maxStringLength: 19,
    name: 'val_accuracy',
    parentPath: joinColumnPath(ColumnType.METRICS, 'summary.json'),
    path: joinColumnPath(ColumnType.METRICS, 'summary.json', 'val_accuracy'),
    pathArray: [ColumnType.METRICS, 'summary.json', 'val_accuracy'],
    types: ['number'],
    maxNumber: 0.6704000234603882,
    minNumber: 0.4277999997138977
  },
  {
    type: ColumnType.PARAMS,
    hasChildren: true,
    name: 'params.yaml',
    parentPath: ColumnType.PARAMS,
    path: joinColumnPath(ColumnType.PARAMS, 'params.yaml')
  },
  {
    type: ColumnType.PARAMS,
    hasChildren: false,
    maxStringLength: 1,
    name: 'epochs',
    parentPath: joinColumnPath(ColumnType.PARAMS, 'params.yaml'),
    path: joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'epochs'),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'epochs'],
    types: ['number'],
    maxNumber: 5,
    minNumber: 2
  },
  {
    type: ColumnType.PARAMS,
    hasChildren: false,
    maxStringLength: 6,
    name: 'learning_rate',
    parentPath: joinColumnPath(ColumnType.PARAMS, 'params.yaml'),
    path: joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'learning_rate'),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'learning_rate'],
    types: ['number'],
    maxNumber: 2.2e-7,
    minNumber: 2e-12
  },
  {
    type: ColumnType.PARAMS,
    hasChildren: false,
    maxStringLength: 8,
    name: 'dvc_logs_dir',
    parentPath: joinColumnPath(ColumnType.PARAMS, 'params.yaml'),
    path: joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'dvc_logs_dir'),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'dvc_logs_dir'],
    types: ['string']
  },
  {
    type: ColumnType.PARAMS,
    hasChildren: false,
    maxStringLength: 8,
    name: 'log_file',
    parentPath: joinColumnPath(ColumnType.PARAMS, 'params.yaml'),
    path: joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'log_file'),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'log_file'],
    types: ['string']
  },
  {
    type: ColumnType.PARAMS,
    hasChildren: false,
    maxStringLength: 5,
    name: 'dropout',
    parentPath: joinColumnPath(ColumnType.PARAMS, 'params.yaml'),
    path: joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'dropout'),
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'dropout'],
    types: ['number'],
    maxNumber: 0.15,
    minNumber: 0.122
  },
  {
    type: ColumnType.PARAMS,
    hasChildren: true,
    name: 'process',
    parentPath: joinColumnPath(ColumnType.PARAMS, 'params.yaml'),
    path: joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'process')
  },
  {
    type: ColumnType.PARAMS,
    hasChildren: false,
    maxStringLength: 4,
    name: 'threshold',
    parentPath: joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'process'),
    path: joinColumnPath(
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
    name: 'test_arg',
    parentPath: joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'process'),
    path: joinColumnPath(
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
    name: nestedParamsFile,
    parentPath: ColumnType.PARAMS,
    path: joinColumnPath(ColumnType.PARAMS, nestedParamsFile)
  },
  {
    type: ColumnType.PARAMS,
    hasChildren: false,
    maxStringLength: 4,
    name: 'test',
    parentPath: joinColumnPath(ColumnType.PARAMS, nestedParamsFile),
    path: joinColumnPath(ColumnType.PARAMS, nestedParamsFile, 'test'),
    pathArray: [ColumnType.PARAMS, nestedParamsFile, 'test'],
    types: ['boolean']
  }
]

export default data
