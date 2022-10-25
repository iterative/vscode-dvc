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
    maxStringLength: 4,
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:bool1',
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'bool1'],
    type: ColumnType.PARAMS,
    types: ['boolean']
  },
  {
    hasChildren: false,
    label: 'bool2',
    maxStringLength: 5,
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:bool2',
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'bool2'],
    type: ColumnType.PARAMS,
    types: ['boolean']
  },
  {
    hasChildren: false,
    label: 'zero',
    maxNumber: 0,
    maxStringLength: 1,
    minNumber: 0,
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:zero',
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'zero'],
    type: ColumnType.PARAMS,
    types: ['number']
  },
  {
    hasChildren: false,
    label: 'negative',
    maxNumber: -123,
    maxStringLength: 4,
    minNumber: -123,
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:negative',
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'negative'],
    type: ColumnType.PARAMS,
    types: ['number']
  },
  {
    hasChildren: false,
    label: 'float',
    maxNumber: 1.9293040037155151,
    maxStringLength: 18,
    minNumber: 1.9293040037155151,
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:float',
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'float'],
    type: ColumnType.PARAMS,
    types: ['number']
  },
  {
    hasChildren: false,
    label: 'string',
    maxStringLength: 6,
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:string',
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'string'],
    type: ColumnType.PARAMS,
    types: ['string']
  },
  {
    hasChildren: false,
    label: 'emptyString',
    maxStringLength: 0,
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:emptyString',
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'emptyString'],
    type: ColumnType.PARAMS,
    types: ['string']
  },
  {
    hasChildren: false,
    label: 'array',
    maxStringLength: 19,
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:array',
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'array'],
    type: ColumnType.PARAMS,
    types: ['array']
  }
]

export default data
