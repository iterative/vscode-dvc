import { ExperimentsOutput } from '../../../cli/reader'
import {
  Column,
  ColumnType,
  Row,
  TableData
} from '../../../experiments/webview/contract'

export const dataTypesOutput: ExperimentsOutput = {
  workspace: {
    baseline: {
      data: {
        timestamp: null,
        params: {
          'params.yaml': {
            data: {
              true: true,
              false: false,
              zero: 0,
              negative: -123,
              float: 0.123,
              string: 'string',
              emptyString: '',
              array: [true, false, 2, 'string']
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
    parentPath: ColumnType.PARAMS,
    path: 'params:params.yaml',
    type: ColumnType.PARAMS
  },
  {
    hasChildren: false,
    label: 'true',
    maxStringLength: 4,
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:true',
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'true'],
    type: ColumnType.PARAMS,
    types: ['boolean']
  },
  {
    hasChildren: false,
    label: 'false',
    maxStringLength: 5,
    parentPath: 'params:params.yaml',
    path: 'params:params.yaml:false',
    pathArray: [ColumnType.PARAMS, 'params.yaml', 'false'],
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
    maxNumber: 0.123,
    maxStringLength: 5,
    minNumber: 0.123,
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
export const rows: Row[] = [
  {
    displayColor: '#945dd6',
    executor: null,
    id: 'workspace',
    label: 'workspace',
    params: {
      'params.yaml': {
        array: [true, false, 2, 'string'],
        emptyString: '',
        false: false,
        float: 0.123,
        negative: -123,
        string: 'string',
        true: true,
        zero: 0
      }
    },
    queued: false,
    running: false,
    selected: true,
    timestamp: null
  },
  {
    displayColor: '#13adc7',
    executor: null,
    id: 'main',
    label: 'main',
    name: 'main',
    queued: false,
    running: false,
    selected: true,
    sha: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
    timestamp: '2020-11-21T19:58:22'
  }
]

export const dataTypesTableData: TableData = {
  changes: [],
  columnOrder: [],
  columnWidths: {},
  filteredCounts: { experiments: 0, checkpoints: 0 },
  filters: [],
  hasCheckpoints: false,
  hasRunningExperiment: false,
  sorts: [],
  columns,
  hasColumns: true,
  rows
}

export default dataTypesTableData
