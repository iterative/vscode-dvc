import { TableData } from '../../../../experiments/webview/contract'
import rowsFixture from './rows'
import columnsFixture from './columns'

const tableDataFixture: TableData = {
  selectedBranches: [],
  cliError: null,
  changes: [],
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
  selectedForPlotsCount: 2,
  sorts: []
}

export default tableDataFixture
