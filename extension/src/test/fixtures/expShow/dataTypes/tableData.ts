import columns from './columns'
import rows from './rows'
import { TableData } from '../../../../experiments/webview/contract'

export const data: TableData = {
  changes: [],
  columnOrder: [],
  columns,
  columnWidths: {},
  filteredCount: 0,
  filters: [],
  hasBranchesToSelect: true,
  hasCheckpoints: false,
  hasColumns: true,
  hasConfig: true,
  hasMoreCommits: { current: true },
  hasRunningWorkspaceExperiment: false,
  hasValidDvcYaml: true,
  isShowingMoreCommits: { current: true },
  rows,
  selectedForPlotsCount: 0,
  sorts: []
}

export default data
