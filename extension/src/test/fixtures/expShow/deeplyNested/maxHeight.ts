import { timestampColumn } from '../../../../experiments/columns/constants'
import { Column, ColumnType } from '../../../../experiments/webview/contract'

export const deeplyNestedColumnsWithHeightOf10: Column[] = [
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
    label: 'doubled',
    maxStringLength: 15,
    parentPath: 'params:params.yaml:nested1',
    path: 'params:params.yaml:nested1.doubled',
    pathArray: ['params', 'params.yaml', 'nested1', 'doubled'],
    type: ColumnType.PARAMS,
    types: ['string']
  },
  {
    hasChildren: true,
    label: 'nested2',
    parentPath: 'params:params.yaml:nested1',
    path: 'params:params.yaml:nested1.nested2',
    type: ColumnType.PARAMS
  },
  {
    hasChildren: true,
    label: 'nested3',
    parentPath: 'params:params.yaml:nested1.nested2',
    path: 'params:params.yaml:nested1.nested2.nested3',
    type: ColumnType.PARAMS
  },
  {
    hasChildren: true,
    label: 'nested4',
    parentPath: 'params:params.yaml:nested1.nested2.nested3',
    path: 'params:params.yaml:nested1.nested2.nested3.nested4',
    type: ColumnType.PARAMS
  },
  {
    hasChildren: true,
    label: 'nested5',
    parentPath: 'params:params.yaml:nested1.nested2.nested3.nested4',
    path: 'params:params.yaml:nested1.nested2.nested3.nested4.nested5',
    type: ColumnType.PARAMS
  },
  {
    hasChildren: true,
    label: 'nested6',
    parentPath: 'params:params.yaml:nested1.nested2.nested3.nested4.nested5',
    path: 'params:params.yaml:nested1.nested2.nested3.nested4.nested5.nested6',
    type: ColumnType.PARAMS
  },
  {
    hasChildren: false,
    label: 'nested7',
    maxStringLength: 6,
    parentPath:
      'params:params.yaml:nested1.nested2.nested3.nested4.nested5.nested6',
    path: 'params:params.yaml:nested1.nested2.nested3.nested4.nested5.nested6.nested7',
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
    label: 'nested5b',
    parentPath: 'params:params.yaml:nested1.nested2.nested3.nested4',
    path: 'params:params.yaml:nested1.nested2.nested3.nested4.nested5b',
    type: ColumnType.PARAMS
  },
  {
    hasChildren: false,
    label: 'nested6',
    maxStringLength: 23,
    parentPath: 'params:params.yaml:nested1.nested2.nested3.nested4.nested5b',
    path: 'params:params.yaml:nested1.nested2.nested3.nested4.nested5b.nested6',
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
    label: 'doubled',
    maxStringLength: 16,
    parentPath: 'params:params.yaml:nested1.nested2.nested3.nested4.nested5b',
    path: 'params:params.yaml:nested1.nested2.nested3.nested4.nested5b.doubled',
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
    label: 'outlier',
    maxStringLength: 1,
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:outlier',
    pathArray: ['params', 'params.yaml', 'outlier'],
    type: ColumnType.PARAMS,
    types: ['number'],
    maxNumber: 1,
    minNumber: 1
  }
]

export const deeplyNestedColumnsWithHeightOf3: Column[] = [
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
    label: 'doubled',
    maxStringLength: 15,
    parentPath: 'params:params.yaml:nested1',
    path: 'params:params.yaml:nested1.doubled',
    pathArray: ['params', 'params.yaml', 'nested1', 'doubled'],
    type: ColumnType.PARAMS,
    types: ['string']
  },
  {
    hasChildren: true,
    label: 'nested1.nested2.nested3.nested4.nested5.nested6',
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:nested1%2Enested2%2Enested3%2Enested4%2Enested5%2Enested6',
    type: ColumnType.PARAMS
  },
  {
    hasChildren: false,
    label: 'nested7',
    maxStringLength: 6,
    parentPath:
      'params:params.yaml:nested1%2Enested2%2Enested3%2Enested4%2Enested5%2Enested6',
    path: 'params:params.yaml:nested1%2Enested2%2Enested3%2Enested4%2Enested5%2Enested6.nested7',
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
    label: 'nested1.nested2.nested3.nested4.nested5b',
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:nested1%2Enested2%2Enested3%2Enested4%2Enested5b',
    type: ColumnType.PARAMS
  },
  {
    hasChildren: false,
    label: 'nested6',
    maxStringLength: 23,
    parentPath:
      'params:params.yaml:nested1%2Enested2%2Enested3%2Enested4%2Enested5b',
    path: 'params:params.yaml:nested1%2Enested2%2Enested3%2Enested4%2Enested5b.nested6',
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
    label: 'doubled',
    maxStringLength: 16,
    parentPath:
      'params:params.yaml:nested1%2Enested2%2Enested3%2Enested4%2Enested5b',
    path: 'params:params.yaml:nested1%2Enested2%2Enested3%2Enested4%2Enested5b.doubled',
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
    label: 'outlier',
    maxStringLength: 1,
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:outlier',
    pathArray: ['params', 'params.yaml', 'outlier'],
    type: ColumnType.PARAMS,
    types: ['number'],
    maxNumber: 1,
    minNumber: 1
  }
]

export const deeplyNestedColumnsWithHeightOf2: Column[] = [
  timestampColumn,
  {
    hasChildren: true,
    label: 'params.yaml:nested1',
    parentPath: 'params',
    path: 'params:params.yaml:nested1',
    type: ColumnType.PARAMS
  },
  {
    hasChildren: false,
    label: 'doubled',
    maxStringLength: 15,
    parentPath: 'params:params.yaml:nested1',
    path: 'params:params.yaml:nested1:doubled',
    pathArray: ['params', 'params.yaml', 'nested1', 'doubled'],
    type: ColumnType.PARAMS,
    types: ['string']
  },
  {
    hasChildren: true,
    label: 'params.yaml:nested1.nested2.nested3.nested4.nested5.nested6',
    parentPath: 'params',
    path: 'params:params.yaml:nested1.nested2.nested3.nested4.nested5.nested6',
    type: ColumnType.PARAMS
  },
  {
    hasChildren: false,
    label: 'nested7',
    maxStringLength: 6,
    parentPath:
      'params:params.yaml:nested1.nested2.nested3.nested4.nested5.nested6',
    path: 'params:params.yaml:nested1.nested2.nested3.nested4.nested5.nested6:nested7',
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
    label: 'params.yaml:nested1.nested2.nested3.nested4.nested5b',
    parentPath: 'params',
    path: 'params:params.yaml:nested1.nested2.nested3.nested4.nested5b',
    type: ColumnType.PARAMS
  },
  {
    hasChildren: false,
    label: 'nested6',
    maxStringLength: 23,
    parentPath: 'params:params.yaml:nested1.nested2.nested3.nested4.nested5b',
    path: 'params:params.yaml:nested1.nested2.nested3.nested4.nested5b:nested6',
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
    label: 'doubled',
    maxStringLength: 16,
    parentPath: 'params:params.yaml:nested1.nested2.nested3.nested4.nested5b',
    path: 'params:params.yaml:nested1.nested2.nested3.nested4.nested5b:doubled',
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
    hasChildren: true,
    label: 'params.yaml',
    parentPath: 'params',
    path: 'params:params.yaml',
    type: ColumnType.PARAMS
  },
  {
    hasChildren: false,
    label: 'outlier',
    maxStringLength: 1,
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:outlier',
    pathArray: ['params', 'params.yaml', 'outlier'],
    type: ColumnType.PARAMS,
    types: ['number'],
    maxNumber: 1,
    minNumber: 1
  }
]

export const deeplyNestedColumnsWithHeightOf1: Column[] = [
  timestampColumn,
  {
    hasChildren: false,
    label: 'params.yaml:nested1.doubled',
    maxStringLength: 16,
    parentPath: 'params',
    path: 'params:doubled',
    pathArray: ['params', 'params.yaml', 'nested1', 'doubled'],
    type: ColumnType.PARAMS,
    types: ['string']
  },
  {
    hasChildren: false,
    label:
      'params.yaml:nested1.nested2.nested3.nested4.nested5.nested6.nested7',
    maxStringLength: 6,
    parentPath: 'params',
    path: 'params:nested7',
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
    hasChildren: false,
    label: 'params.yaml:nested1.nested2.nested3.nested4.nested5b.nested6',
    maxStringLength: 23,
    parentPath: 'params',
    path: 'params:nested6',
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
    label: 'params.yaml:outlier',
    maxStringLength: 1,
    parentPath: 'params',
    path: 'params:outlier',
    pathArray: ['params', 'params.yaml', 'outlier'],
    type: ColumnType.PARAMS,
    types: ['number'],
    maxNumber: 1,
    minNumber: 1
  }
]
