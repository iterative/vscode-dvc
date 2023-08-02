import { TableData } from '../../../../experiments/webview/contract'
import rowsFixture from './rows'
import columnsFixture from './columns'

const tableDataFixture: TableData = {
  changes: [],
  cliError: null,
  columnOrder: [],
  columns: columnsFixture,
  columnWidths: {},
  filters: [],
  hasBranchesToSelect: true,
  hasCheckpoints: true,
  hasColumns: true,
  hasConfig: true,
  hasMoreCommits: { main: true },
  hasRunningWorkspaceExperiment: true,
  isShowingMoreCommits: { main: true },
  rows: rowsFixture,
  selectedBranches: [],
  selectedForPlotsCount: 2,
  showOnlyChanged: false,
  sorts: []
}

export default tableDataFixture
