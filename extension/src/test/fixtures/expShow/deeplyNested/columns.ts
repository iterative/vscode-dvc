import { timestampColumn } from '../../../../experiments/columns/constants'
import { Column, ColumnType } from '../../../../experiments/webview/contract'

const data: Column[] = [
  timestampColumn,
  {
    hasChildren: true,
    label: 'params.yaml',
    parentPath: 'params',
    path: 'params:params.yaml',
    type: ColumnType.PARAMS
  },
  {
    hasChildren: true,
    label: 'nested1',
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:nested1',
    type: ColumnType.PARAMS
  },
  {
    hasChildren: false,
    maxStringLength: 15,
    label: 'doubled',
    parentPath: 'params:params.yaml:nested1',
    path: 'params:params.yaml:nested1.doubled',
    pathArray: ['params', 'params.yaml', 'nested1', 'doubled'],
    type: ColumnType.PARAMS,
    types: ['string']
  },
  {
    hasChildren: true,
    label: 'nested1.nested2.nested3.nested4',
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:nested1%2Enested2%2Enested3%2Enested4',
    type: ColumnType.PARAMS
  },
  {
    hasChildren: true,
    label: 'nested5',
    parentPath: 'params:params.yaml:nested1%2Enested2%2Enested3%2Enested4',
    path: 'params:params.yaml:nested1%2Enested2%2Enested3%2Enested4.nested5',
    type: ColumnType.PARAMS
  },
  {
    hasChildren: true,
    label: 'nested6',
    parentPath:
      'params:params.yaml:nested1%2Enested2%2Enested3%2Enested4.nested5',
    path: 'params:params.yaml:nested1%2Enested2%2Enested3%2Enested4.nested5.nested6',
    type: ColumnType.PARAMS
  },
  {
    hasChildren: false,
    maxStringLength: 6,
    label: 'nested7',
    parentPath:
      'params:params.yaml:nested1%2Enested2%2Enested3%2Enested4.nested5.nested6',
    path: 'params:params.yaml:nested1%2Enested2%2Enested3%2Enested4.nested5.nested6.nested7',
    pathArray: [
      'params',
      'params.yaml',
      'nested1',
      'nested2',
      'nested3',
      'nested4',
      'nested5',
      'nested6',
      'nested7'
    ],
    type: ColumnType.PARAMS,
    types: ['string']
  },
  {
    hasChildren: true,
    label: 'nested1.nested2.nested3',
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:nested1%2Enested2%2Enested3',
    type: ColumnType.PARAMS
  },
  {
    hasChildren: true,
    label: 'nested4',
    parentPath: 'params:params.yaml:nested1%2Enested2%2Enested3',
    path: 'params:params.yaml:nested1%2Enested2%2Enested3.nested4',
    type: ColumnType.PARAMS
  },
  {
    hasChildren: true,
    label: 'nested5b',
    parentPath: 'params:params.yaml:nested1%2Enested2%2Enested3.nested4',
    path: 'params:params.yaml:nested1%2Enested2%2Enested3.nested4.nested5b',
    type: ColumnType.PARAMS
  },
  {
    hasChildren: false,
    maxStringLength: 23,
    label: 'nested6',
    parentPath:
      'params:params.yaml:nested1%2Enested2%2Enested3.nested4.nested5b',
    path: 'params:params.yaml:nested1%2Enested2%2Enested3.nested4.nested5b.nested6',
    pathArray: [
      'params',
      'params.yaml',
      'nested1',
      'nested2',
      'nested3',
      'nested4',
      'nested5b',
      'nested6'
    ],
    type: ColumnType.PARAMS,
    types: ['string']
  },
  {
    hasChildren: false,
    maxStringLength: 16,
    label: 'doubled',
    parentPath:
      'params:params.yaml:nested1%2Enested2%2Enested3.nested4.nested5b',
    path: 'params:params.yaml:nested1%2Enested2%2Enested3.nested4.nested5b.doubled',
    pathArray: [
      'params',
      'params.yaml',
      'nested1',
      'nested2',
      'nested3',
      'nested4',
      'nested5b',
      'doubled'
    ],
    type: ColumnType.PARAMS,
    types: ['string']
  },
  {
    hasChildren: false,
    maxStringLength: 1,
    label: 'outlier',
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:outlier',
    pathArray: ['params', 'params.yaml', 'outlier'],
    type: ColumnType.PARAMS,
    types: ['number'],
    maxNumber: 1,
    minNumber: 1
  }
]

export default data
