import { TableData } from '../../../../experiments/webview/contract'
import rowsFixture from './rows'
import columnsFixture from './columns'

const data: TableData = {
  changes: [],
  columnOrder: [],
  columns: columnsFixture,
  columnWidths: {},
  filteredCount: 0,
  filters: [],
  hasCheckpoints: true,
  hasColumns: true,
  hasConfig: true,
  hasMoreCommits: true,
  hasRunningExperiment: true,
  hasValidDvcYaml: true,
  isBranchesView: false,
  isShowingMoreCommits: true,
  rows: rowsFixture,
  selectedForPlotsCount: 0,
  sorts: []
}

export default data
