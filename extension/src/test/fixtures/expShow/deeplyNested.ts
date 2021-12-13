import { TableData } from '../../../experiments/webview/contract'

const deeplyNestedTableData: TableData = {
  changes: ['params:params.yaml:nested1.nested2.nested3.nested4b.nested5b'],
  columnOrder: [],
  columnWidths: {},
  columns: [
    {
      group: 'params',
      hasChildren: false,
      name: 'seed',
      parentPath: 'params:params.yaml',
      path: 'params:params.yaml:seed',
      maxStringLength: 6,
      minNumber: 473987,
      maxNumber: 473987,
      types: ['number']
    },
    {
      group: 'params',
      hasChildren: false,
      name: 'nested7',
      parentPath:
        'params:params.yaml:nested1.nested2.nested3.nested4.nested5.nested6',
      path: 'params:params.yaml:nested1.nested2.nested3.nested4.nested5.nested6.nested7',
      maxStringLength: 4,
      minNumber: 1234,
      maxNumber: 1234,
      types: ['number']
    },
    {
      group: 'params',
      hasChildren: true,
      name: 'nested6',
      parentPath: 'params:params.yaml:nested1.nested2.nested3.nested4.nested5',
      path: 'params:params.yaml:nested1.nested2.nested3.nested4.nested5.nested6'
    },
    {
      group: 'params',
      hasChildren: true,
      name: 'nested5',
      parentPath: 'params:params.yaml:nested1.nested2.nested3.nested4',
      path: 'params:params.yaml:nested1.nested2.nested3.nested4.nested5'
    },
    {
      group: 'params',
      hasChildren: true,
      name: 'nested4',
      parentPath: 'params:params.yaml:nested1.nested2.nested3',
      path: 'params:params.yaml:nested1.nested2.nested3.nested4'
    },
    {
      group: 'params',
      hasChildren: false,
      name: 'nested5b',
      parentPath: 'params:params.yaml:nested1.nested2.nested3.nested4b',
      path: 'params:params.yaml:nested1.nested2.nested3.nested4b.nested5b',
      maxStringLength: 4,
      minNumber: 5678,
      maxNumber: 5678,
      types: ['number']
    },
    {
      group: 'params',
      hasChildren: true,
      name: 'nested4b',
      parentPath: 'params:params.yaml:nested1.nested2.nested3',
      path: 'params:params.yaml:nested1.nested2.nested3.nested4b'
    },
    {
      group: 'params',
      hasChildren: true,
      name: 'nested3',
      parentPath: 'params:params.yaml:nested1.nested2',
      path: 'params:params.yaml:nested1.nested2.nested3'
    },
    {
      group: 'params',
      hasChildren: true,
      name: 'nested2',
      parentPath: 'params:params.yaml:nested1',
      path: 'params:params.yaml:nested1.nested2'
    },
    {
      group: 'params',
      hasChildren: true,
      name: 'nested1',
      parentPath: 'params:params.yaml',
      path: 'params:params.yaml:nested1'
    },
    {
      group: 'params',
      hasChildren: true,
      name: 'params.yaml',
      parentPath: 'params',
      path: 'params:params.yaml'
    },
    {
      group: 'metrics',
      hasChildren: false,
      name: 'step',
      parentPath: 'metrics:logs.json',
      path: 'metrics:logs.json:step',
      maxStringLength: 1,
      minNumber: 9,
      maxNumber: 9,
      types: ['number']
    },
    {
      group: 'metrics',
      hasChildren: false,
      name: 'loss',
      parentPath: 'metrics:logs.json',
      path: 'metrics:logs.json:loss',
      maxStringLength: 18,
      minNumber: 1.1647908687591553,
      maxNumber: 1.1647908687591553,
      types: ['number']
    },
    {
      group: 'metrics',
      hasChildren: false,
      name: 'acc',
      parentPath: 'metrics:logs.json',
      path: 'metrics:logs.json:acc',
      maxStringLength: 5,
      minNumber: 0.752,
      maxNumber: 0.752,
      types: ['number']
    },
    {
      group: 'metrics',
      hasChildren: true,
      name: 'logs.json',
      parentPath: 'metrics',
      path: 'metrics:logs.json'
    }
  ],
  rows: [
    {
      id: 'workspace',
      timestamp: null,
      params: {
        'params.yaml': {
          seed: 473987,
          nested1: {
            nested2: {
              nested3: {
                nested4: {
                  nested5: {
                    nested6: {
                      nested7: 1234
                    }
                  }
                },
                nested4b: {
                  nested5b: 5678
                }
              }
            }
          }
        }
      },
      queued: false,
      running: false,
      executor: null,
      metrics: {
        'logs.json': {
          step: 9,
          loss: 1.1647908687591553,
          acc: 0.752
        }
      },
      displayName: 'workspace'
    },
    {
      id: 'bc310635f605e029d1767b5deac9a8d597ea6172',
      timestamp: '2021-12-13T15:07:29',
      params: {
        'params.yaml': {
          seed: 473987
        }
      },
      queued: false,
      running: false,
      executor: null,
      metrics: {
        'logs.json': {
          step: 9,
          loss: 1.1647908687591553,
          acc: 0.752
        }
      },
      name: 'limit-header-groups',
      displayName: 'limit-header-groups'
    }
  ],
  sorts: []
}

export default deeplyNestedTableData
