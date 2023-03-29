import columns from './columns'
import rows from './rows'
import { TableData } from '../../../../experiments/webview/contract'

export const data: TableData = {
  changes: [],
  columnOrder: [],
  columnWidths: {},
  filteredCount: 0,
  filters: [],
  hasCheckpoints: false,
  hasConfig: true,
  hasMoreCommits: true,
  hasRunningExperiment: false,
  hasValidDvcYaml: true,
  isShowingMoreCommits: true,
  sorts: [],
  columns,
  hasColumns: true,
  rows
}

export default data
