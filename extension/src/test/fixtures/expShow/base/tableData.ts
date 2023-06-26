import { TableData } from '../../../../experiments/webview/contract'
import rowsFixture from './rows'
import columnsFixture from './columns'

const tableDataFixture: TableData = {
  cliError: null,
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
  hasRunningWorkspaceExperiment: true,
  hasValidDvcYaml: true,
  isShowingMoreCommits: { main: true },
  rows: rowsFixture,
  selectedForPlotsCount: 2,
  sorts: []
}

export default tableDataFixture
