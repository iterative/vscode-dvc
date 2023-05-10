import columns from './columns'
import rows from './rows'
import { TableData } from '../../../../experiments/webview/contract'

const data: TableData = {
  changes: [],
  columnOrder: [],
  columns,
  columnWidths: {},
  filteredCount: 0,
  filters: [
    'params:params.yaml:nested1.doubled',
    'params:params.yaml:nested1%2Enested2%2Enested3.nested4.nested5b.doubled'
  ],
  hasBranchesToSelect: true,
  hasCheckpoints: false,
  hasColumns: true,
  hasConfig: true,
  hasMoreCommits: { main: true },
  hasRunningWorkspaceExperiment: false,
  hasValidDvcYaml: true,
  isBranchesView: false,
  isShowingMoreCommits: { main: true },
  rows,
  selectedForPlotsCount: 0,
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
  ]
}

export default data
