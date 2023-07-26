import { timestampColumn } from '../../../../experiments/columns/constants'
import { Column, ColumnType } from '../../../../experiments/webview/contract'

const data: Column[] = [
  timestampColumn,
  {
    hasChildren: true,
    label: 'params.yaml',
    parentPath: ColumnType.PARAMS,
    path: 'params:params.yaml',
    type: ColumnType.PARAMS
  },
  {
    hasChildren: false,
    label: 'bool1',
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:bool1',
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'bool1'],
    type: ColumnType.PARAMS,
    firstValueType: 'boolean'
  },
  {
    hasChildren: false,
    label: 'bool2',
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:bool2',
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'bool2'],
    type: ColumnType.PARAMS,
    firstValueType: 'boolean'
  },
  {
    hasChildren: false,
    label: 'zero',
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:zero',
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'zero'],
    type: ColumnType.PARAMS,
    firstValueType: 'number'
  },
  {
    hasChildren: false,
    label: 'negative',
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:negative',
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'negative'],
    type: ColumnType.PARAMS,
    firstValueType: 'number'
  },
  {
    hasChildren: false,
    label: 'float',
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:float',
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'float'],
    type: ColumnType.PARAMS,
    firstValueType: 'number'
  },
  {
    hasChildren: false,
    label: 'string',
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:string',
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'string'],
    type: ColumnType.PARAMS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'emptyString',
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:emptyString',
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'emptyString'],
    type: ColumnType.PARAMS,
    firstValueType: 'string'
  },
  {
    hasChildren: false,
    label: 'array',
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:array',
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'array'],
    type: ColumnType.PARAMS,
    firstValueType: 'array'
  }
]

export default data
