import { ExperimentsOutput } from '../../../cli/reader'
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
        queued: false,
        running: false,
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
        queued: false,
        running: false,
        executor: null,
        name: 'main'
      }
    }
  }
}

export const columns: Column[] = [
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

export const rows = [
  {
    id: 'workspace',
    label: 'workspace',
    timestamp: null,
    queued: false,
    running: false,
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
    selected: true
  },
  {
    id: 'main',
    label: 'main',
    timestamp: '2020-11-21T19:58:22',
    queued: false,
    running: false,
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
    selected: true
  }
]

const deeplyNestedTableData: TableData = {
  changes: [],
  columnOrder: [],
  columnWidths: {},
  filters: [],
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
