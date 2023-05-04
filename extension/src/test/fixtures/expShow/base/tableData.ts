import { TableData } from '../../../../experiments/webview/contract'
import { rowsFixtureWithBranches } from './rows'
import columnsFixture from './columns'

const tableDataFixture: TableData = {
  changes: [],
  columnOrder: [],
  columns: columnsFixture,
  columnWidths: {},
  filteredCount: 0,
  filters: [],
  hasBranchesToSelect: true,
  hasCheckpoints: true,
  hasColumns: true,
  hasConfig: true,
  hasMoreCommits: { main: true },
  hasRunningExperiment: true,
  hasValidDvcYaml: true,
  isShowingMoreCommits: { main: true },
  isBranchesView: false,
  rows: rowsFixtureWithBranches,
  selectedForPlotsCount: 2,
  sorts: []
}

export default tableDataFixture
