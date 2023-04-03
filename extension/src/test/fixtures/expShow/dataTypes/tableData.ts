import columns from './columns'
import rows from './rows'
import { TableData } from '../../../../experiments/webview/contract'

export const data: TableData = {
  changes: [],
  columnOrder: [],
  columnWidths: {},
  filteredCounts: { experiments: 0, checkpoints: 0 },
  filters: [],
  hasCheckpoints: false,
  hasConfig: true,
  hasMoreCommits: true,
  hasRunningExperiment: false,
  hasValidDvcYaml: true,
  isShowingMoreCommits: true,
  isBranchesView: false,
  sorts: [],
  columns,
  hasColumns: true,
  rows
}

export default data
