import { ExperimentsOutput, ExperimentStatus } from '../../../cli/dvc/contract'
import { timestampColumn } from '../../../experiments/columns/constants'
import {
  Column,
  ColumnType,
  TableData
} from '../../../experiments/webview/contract'

export const deeplyNestedOutput: ExperimentsOutput = {
  workspace: {
    baseline: {
      data: {
        timestamp: null,
        params: {
          'params.yaml': {
            data: {
              nested1: {
                doubled: 'first instance!',
                nested2: {
                  nested3: {
                    nested4: {
                      nested5: { nested6: { nested7: 'Lucky!' } },
                      nested5b: {
                        nested6: 'Wow!!!!!!!!!!!!!!!!!!!!',
                        doubled: 'second instance!'
                      }
                    }
                  }
                }
              },
              outlier: 1
            }
          }
        },
        status: ExperimentStatus.SUCCESS,
        executor: null
      }
    }
  },
  '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77': {
    baseline: {
      data: {
        timestamp: '2020-11-21T19:58:22',
        params: {
          'params.yaml': {
            data: {
              nested1: {
                doubled: 'first instance!',
                nested2: {
                  nested3: {
                    nested4: {
                      nested5: { nested6: { nested7: 'Lucky!' } },
                      nested5b: {
                        nested6: 'Wow!!!!!!!!!!!!!!!!!!!!',
                        doubled: 'second instance!'
                      }
                    }
                  }
                }
              },
              outlier: 1
            }
          }
        },
        status: ExperimentStatus.SUCCESS,
        executor: null,
        name: 'main'
      }
    }
  }
}

export const columns: Column[] = [
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

export const columnsWithDepthOf10: Column[] = [
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

export const columnsWithDepthOf3: Column[] = [
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

export const columnsWithDepthOf2: Column[] = [
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

export const columnsWithDepthOf1: Column[] = [
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

export const rows = [
  {
    id: 'workspace',
    label: 'workspace',
    executor: null,
    params: {
      'params.yaml': {
        nested1: {
          doubled: 'first instance!',
          nested2: {
            nested3: {
              nested4: {
                nested5: { nested6: { nested7: 'Lucky!' } },
                nested5b: {
                  nested6: 'Wow!!!!!!!!!!!!!!!!!!!!',
                  doubled: 'second instance!'
                }
              }
            }
          }
        },
        outlier: 1
      }
    },
    displayColor: '#945dd6',
    selected: true,
    status: ExperimentStatus.SUCCESS,
    starred: false
  },
  {
    id: 'main',
    label: 'main',
    Created: '2020-11-21T19:58:22',
    status: ExperimentStatus.SUCCESS,
    executor: null,
    name: 'main',
    sha: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
    params: {
      'params.yaml': {
        nested1: {
          doubled: 'first instance!',
          nested2: {
            nested3: {
              nested4: {
                nested5: { nested6: { nested7: 'Lucky!' } },
                nested5b: {
                  nested6: 'Wow!!!!!!!!!!!!!!!!!!!!',
                  doubled: 'second instance!'
                }
              }
            }
          }
        },
        outlier: 1
      }
    },
    displayColor: '#13adc7',
    selected: true,
    starred: false
  }
]

const deeplyNestedTableData: TableData = {
  changes: [],
  columnOrder: [],
  columnWidths: {},
  filteredCounts: { experiments: 0, checkpoints: 0 },
  filters: [
    'params:params.yaml:nested1.doubled',
    'params:params.yaml:nested1%2Enested2%2Enested3.nested4.nested5b.doubled'
  ],
  hasCheckpoints: false,
  hasRunningExperiment: false,
  sorts: [
    {
      path: 'params:params.yaml:nested1.doubled',
      descending: true
    },
    {
      path: 'params:params.yaml:outlier',
      descending: false
    },
    {
      path: 'params:params.yaml:nested1%2Enested2%2Enested3.nested4.nested5b.nested6',
      descending: false
    },
    {
      path: 'params:params.yaml:nested1%2Enested2%2Enested3.nested4.nested5b.doubled',
      descending: true
    }
  ],
  columns,
  hasColumns: true,
  rows
}

export default deeplyNestedTableData
