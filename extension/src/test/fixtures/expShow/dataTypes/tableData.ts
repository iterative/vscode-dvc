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
  hasCheckpoints: false,
  hasColumns: true,
  hasConfig: true,
  hasMoreCommits: true,
  hasRunningExperiment: false,
  hasValidDvcYaml: true,
  isShowingMoreCommits: true,
  rows,
  selectedForPlotsCount: 0,
  sorts: []
}

export default data
