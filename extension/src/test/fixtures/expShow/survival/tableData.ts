import { TableData } from '../../../../experiments/webview/contract'
import rowsFixture from './rows'
import columnsFixture from './columns'

const data: TableData = {
  filteredCounts: { experiments: 0, checkpoints: 0 },
  rows: rowsFixture,
  columns: columnsFixture,
  filters: [],
  hasCheckpoints: true,
  hasConfig: true,
  hasRunningExperiment: true,
  hasColumns: true,
  hasMoreCommits: true,
  hasValidDvcYaml: true,
  isBranchesView: false,
  isShowingMoreCommits: true,
  sorts: [],
  changes: [],
  columnOrder: [],
  columnWidths: {}
}

export default data
