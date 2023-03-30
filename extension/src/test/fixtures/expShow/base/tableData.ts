import { TableData } from '../../../../experiments/webview/contract'
import rowsFixture from './rows'
import columnsFixture from './columns'

const tableDataFixture: TableData = {
  filteredCount: 0,
  rows: rowsFixture,
  columns: columnsFixture,
  filters: [],
  hasCheckpoints: true,
  hasConfig: true,
  hasMoreCommits: true,
  hasRunningExperiment: true,
  hasValidDvcYaml: true,
  hasColumns: true,
  isShowingMoreCommits: true,
  sorts: [],
  changes: [],
  columnOrder: [],
  columnWidths: {}
}

export default tableDataFixture
