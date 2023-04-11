import { TableData } from '../../../../experiments/webview/contract'
import rowsFixture from './rows'
import columnsFixture from './columns'

const tableDataFixture: TableData = {
  changes: [],
  columnOrder: [],
  columns: columnsFixture,
  columnWidths: {},
  filteredCount: 0,
  filters: [],
  hasBranchesSelected: false,
  hasCheckpoints: true,
  hasColumns: true,
  hasConfig: true,
  hasMoreCommits: true,
  hasRunningExperiment: true,
  hasValidDvcYaml: true,
  isShowingMoreCommits: true,
  isBranchesView: false,
  rows: rowsFixture,
  selectedForPlotsCount: 2,
  sorts: []
}

export default tableDataFixture
